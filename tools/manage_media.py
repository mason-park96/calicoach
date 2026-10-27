#!/usr/bin/env python3
# Calicoach Pexels API / licensed direct MP4 downloader + review workflow.
# Python 3.10+, no third-party libraries. NEVER commit an API key to GitHub.
import argparse, json, os, sys, urllib.request, urllib.error, shutil, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = json.loads((ROOT/'tools'/'video_sources.json').read_text(encoding='utf-8'))
SOURCES = {entry['exercise_id']: entry for entry in MANIFEST['sources']}
PENDING = ROOT/'media'/'pending'
VIDEOS = ROOT/'media'/'videos'
CATALOG = ROOT/'video-catalog.js'


def api_lookup(video_id, key):
    url=f'https://api.pexels.com/v1/videos/videos/{video_id}'
    req=urllib.request.Request(url,headers={'Authorization':key,'User-Agent':'CalicoachPersonalMedia/1.0'})
    with urllib.request.urlopen(req,timeout=30) as r:
        return json.load(r)


def select_mp4(data):
    files=[item for item in data.get('video_files',[]) if item.get('file_type')=='video/mp4' and item.get('link')]
    if not files: raise RuntimeError('No MP4 variants in API response')
    # Prefer <=720p for storage, if available; otherwise smallest valid MP4.
    medium=[f for f in files if 360 <= max(int(f.get('width') or 0),int(f.get('height') or 0)) <= 1280]
    return sorted(medium or files,key=lambda f:(abs(max(int(f.get('width') or 0),int(f.get('height') or 0))-720), int(f.get('width') or 0)*int(f.get('height') or 0)))[0]


def download(entry,key):
    if entry['provider']=='Pexels':
        data=api_lookup(entry['video_id'],key)
        if int(data.get('id') or -1)!=entry['video_id']:
            raise RuntimeError('Unexpected Pexels video ID')
        choice=select_mp4(data)
    elif entry['provider']=='Mixkit' and entry.get('download_url'):
        choice={'link':entry['download_url']}
    else:
        raise RuntimeError('Unsupported video provider')
    PENDING.mkdir(parents=True,exist_ok=True)
    dest=PENDING/entry['filename']
    tmp=dest.with_suffix('.part')
    req=urllib.request.Request(choice['link'],headers={'User-Agent':'Mozilla/5.0'})
    total=0
    try:
        with urllib.request.urlopen(req,timeout=60) as response, tmp.open('wb') as f:
            while True:
                chunk=response.read(1024*512)
                if not chunk: break
                total+=len(chunk)
                if total>100*1024*1024: raise RuntimeError('Video larger than 100 MB; aborted')
                f.write(chunk)
        if total<1024: raise RuntimeError('Video is too small; aborted')
        tmp.replace(dest)
    finally:
        if tmp.exists(): tmp.unlink()
    print(f'[downloaded for review] {entry["exercise_id"]}: {dest} ({total/1024/1024:.2f} MB)')
    print('Original:',entry['url'])


def catalog_from_files():
    # Only approved files in media/videos are exposed in the app.
    approved=[]
    for key,entry in SOURCES.items():
        if (VIDEOS/entry['filename']).is_file():
            clip={'file':f'./media/videos/{entry["filename"]}','url':entry['url'],'creator':entry['creator'],'license':entry['license'],'provider':entry['provider']}
            if entry.get('license_url'): clip['license_url']=entry['license_url']
            if entry.get('input_file'): clip['original_file']='./'+entry['input_file']
            for field in ('display_label', 'display_note'):
                if entry.get(field): clip[field]=entry[field]
            poster=VIDEOS/(Path(entry['filename']).stem+'.jpg')
            if poster.is_file(): clip['poster']=f'./media/videos/{poster.name}'
            approved.append((key,clip))
    value={key:obj for key,obj in approved}
    CATALOG.write_text('/* Active exercise clips. Source: tools/video_sources.json */\nwindow.CalicoachVideoCatalog = Object.freeze('+json.dumps(value,ensure_ascii=False,indent=2)+');\n',encoding='utf-8')
    print(f'Active catalog: {len(value)} clip(s)')


def approve(entry):
    video=PENDING/entry['filename']
    if not video.exists():
        raise FileNotFoundError(f'{video} does not exist. Download it first or copy a licensed MP4 into media/pending/{entry["filename"]}')
    if video.stat().st_size<1024: raise RuntimeError('File too small; inspect before approval')
    # This command never pretends the content is correct. Human approval is explicit.
    answer=input(f'Have you WATCHED {video.name} and verified it depicts exactly "{entry["exercise_name"]}"? type APPROVE: ')
    if answer!='APPROVE': print('Not approved.'); return
    VIDEOS.mkdir(parents=True,exist_ok=True)
    shutil.copy2(video,VIDEOS/entry['filename'])
    catalog_from_files()
    print('Approved. Git add/commit/push will publish the approved file.')


def main():
    p=argparse.ArgumentParser(description='Calicoach real exercise demo media manager')
    p.add_argument('action',choices=['list','fetch','approve','refresh'])
    p.add_argument('exercise',nargs='?',help='exercise id (e.g. push) or all for fetch')
    args=p.parse_args()
    if args.action=='list':
        for item in MANIFEST['sources']:
            print(f'{item["exercise_id"]:12} {item["exercise_name"]:20} {item["url"]} [{item["confidence_from_title"]}]')
        return
    if args.action=='refresh': catalog_from_files();return
    if args.exercise not in SOURCES and not(args.action=='fetch' and args.exercise=='all'):
        p.error('Please give an exercise ID from list (fetch also accepts all)')
    if args.action=='fetch':
        key=os.environ.get('PEXELS_API_KEY','').strip()
        entries=[item for item in SOURCES.values() if item['provider']!='사용자 제공'] if args.exercise=='all' else [SOURCES[args.exercise]]
        if any(item['provider']=='사용자 제공' for item in entries):
            p.error('Local GIF sources: run tools/import_user_media.py to rebuild them.')
        if not key and any(item['provider']=='Pexels' for item in entries):
            p.error('Missing PEXELS_API_KEY. Get a free key from https://www.pexels.com/api/ and set it in your Windows terminal. NEVER commit the key.')
        errors=0
        for item in entries:
            try: download(item,key)
            except (RuntimeError, OSError, urllib.error.HTTPError, urllib.error.URLError) as exc:
                errors+=1;print(f'[FAILED] {item["exercise_id"]}: {exc}',file=sys.stderr)
        sys.exit(1 if errors else 0)
    if args.action=='approve': approve(SOURCES[args.exercise])

if __name__=='__main__': main()
