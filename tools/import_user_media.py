"""Match the 16 user-supplied GIFs and build mobile MP4s without changing originals."""
import hashlib
import json
import subprocess
import tempfile
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
MAPPING = {
    'squat': '맨몸 스쿼트.gif', 'push': '푸시업 gif.gif',
    'wraise': 'w 레이즈.gif', 'traise': 'T 레이즈.gif',
    'snowangel': '리버스 스노우 엔젤.gif', 'dead': '데드버그.gif',
    'bird': '버드독.gif', 'singlebridge': '한발 글루트 브리지.gif',
    'clam': '클램셸.gif', 'hipabduct': '옆으로 누워 다리 들기.gif',
    'closepush': '좁은 푸시업.gif', 'tempo': '템포 푸시업.gif',
    'chairsquat': '의자 스쿼트.gif', 'temposquat': '천천히 스쿼트.gif',
    'prep2': '고관절 워밍업.gif', 'prep3': '앉아서 무릎 번갈아 들기.gif',
    'prep4': '복부 긴장·호흡.gif', 'cool1': '종아리·발바닥 가볍게 풀기.gif',
}
ILLUSTRATED = {'push', 'wraise', 'traise', 'singlebridge', 'closepush', 'tempo',
               'chairsquat', 'temposquat', 'prep4'}


def run(*args):
    subprocess.run(args, cwd=ROOT, check=True)


def convert(exercise_id, source, destination):
    common = ['-map', '0:v:0', '-vf',
              "scale=w='min(1280,iw)':h='min(720,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2,setpts=PTS-STARTPTS,fps=fps=30:start_time=0",
              '-c:v', 'libx264', '-preset', 'fast', '-crf', '22', '-pix_fmt',
              'yuv420p', '-an', '-movflags', '+faststart', '-threads', '2']
    prefix = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y']
    if exercise_id not in {'tempo', 'temposquat'}:
        run(*prefix, '-i', str(source), *common, str(destination))
        return
    # Review established the top and bottom poses; build one 3s down / 1s up cycle.
    with Image.open(source) as gif, tempfile.TemporaryDirectory(dir=ROOT/'media'/'pending') as tmp:
        temp = Path(tmp)
        if exercise_id == 'tempo':
            down = [10, 11, 12, 13, 14, 0, 1, 2, 3]
            up = [4, 5, 6, 7, 8, 9]
        else:
            down = list(range(21))
            up = list(range(21, gif.n_frames))
        lines = []
        for index, (frame, seconds) in enumerate(
                [(n, 3 / len(down)) for n in down] + [(n, 1 / len(up)) for n in up]):
            gif.seek(frame)
            name = f'{index:03}.png'
            gif.convert('RGB').save(temp/name)
            lines.extend([f"file '{name}'", f'duration {seconds:.9f}'])
        lines.append(f"file '{name}'")
        listing = temp/'frames.txt'
        listing.write_text('\n'.join(lines), encoding='utf-8')
        common[3] += ',tpad=stop_mode=clone:stop_duration=1'
        run(*prefix, '-f', 'concat', '-safe', '0', '-i', str(listing),
            *common, '-t', '4', str(destination))


def main():
    manifest_path = ROOT/'tools'/'video_sources.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    entries = {entry['exercise_id']: entry for entry in manifest['sources']}
    output = ROOT/'media'/'videos'
    output.mkdir(exist_ok=True)
    (ROOT/'media'/'pending').mkdir(exist_ok=True)
    report = []
    for exercise_id, filename in MAPPING.items():
        if sys.argv[1:] and exercise_id not in sys.argv[1:]:
            continue
        source = ROOT/'media'/'gif'/filename
        if not source.is_file():
            raise FileNotFoundError(source)
        destination = output/f'{exercise_id}.mp4'
        convert(exercise_id, source, destination)
        run('ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(destination),
            '-frames:v', '1', '-q:v', '3', str(output/f'{exercise_id}.jpg'))
        run('ffmpeg', '-hide_banner', '-loglevel', 'error', '-i', str(destination), '-f', 'null', '-')
        label = '호흡 원리 참고 영상' if exercise_id == 'prep4' else (
            '인체 모형 동작 시연' if exercise_id in ILLUSTRATED else '실제 사람 동작 시연')
        entry = {
            'exercise_id': exercise_id,
            'exercise_name': '앉아서 무릎 펴기' if exercise_id == 'prep3' else source.stem.removesuffix(' gif'),
            'provider': '사용자 제공', 'input_file': f'media/gif/{filename}',
            'url': f'./media/gif/{filename}', 'creator': '사용자 제공 자료',
            'license': '', 'match_status': 'user_supplied_mapped',
            'confidence_from_title': 'visual_review', 'filename': destination.name,
            'display_label': label,
        }
        if exercise_id == 'prep4':
            entry['display_note'] = '호흡 원리를 보여주는 그림입니다. 복부 긴장은 아래 동작 설명을 따라 가볍게 유지하세요.'
        if exercise_id in {'tempo', 'temposquat'}:
            entry['display_note'] = '내려가기 3초 · 올라오기 1초에 맞춰 편집한 시연입니다.'
        entries[exercise_id] = entry
        report.append({**entry, 'source_sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
                       'bytes': destination.stat().st_size})
        print(f'Imported {exercise_id}', flush=True)
    manifest['sources'] = list(entries.values())
    manifest['unmatched'] = [key for key in manifest['unmatched'] if key not in MAPPING]
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    (ROOT/'media'/'pending'/'user-media-import-report.json').write_text(
        json.dumps(report, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    run(__import__('sys').executable, str(ROOT/'tools'/'manage_media.py'), 'refresh')


if __name__ == '__main__':
    main()
