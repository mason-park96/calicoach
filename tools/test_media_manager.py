"""Offline unit tests for media manager helpers; does not download any copyrighted asset."""
import importlib.util
from pathlib import Path
import tempfile,json
spec=importlib.util.spec_from_file_location('media_manager',Path(__file__).with_name('manage_media.py'))
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
assert len(module.SOURCES)==11
example={'video_files':[
    {'file_type':'video/mp4','width':3840,'height':2160,'link':'big'},
    {'file_type':'video/mp4','width':1280,'height':720,'link':'small'},
    {'file_type':'video/webm','width':1000,'height':700,'link':'other'}
]}
assert module.select_mp4(example)['link']=='small'
assert all(e['url'].startswith('https://www.pexels.com/video/') for e in module.SOURCES.values())
# Simulate approval catalog production in a temporary folder; avoid changing distributed artifacts.
with tempfile.TemporaryDirectory() as d:
    base=Path(d)
    module.VIDEOS=base/'videos';module.VIDEOS.mkdir()
    module.CATALOG=base/'video-catalog.js'
    (module.VIDEOS/'push.mp4').write_bytes(b'\0'*4096)
    module.catalog_from_files()
    text=module.CATALOG.read_text(encoding='utf-8')
    assert 'push.mp4' in text and 'squat.mp4' not in text
print('PASS media acquisition mapping, best MP4 selection, manual approval catalog')
