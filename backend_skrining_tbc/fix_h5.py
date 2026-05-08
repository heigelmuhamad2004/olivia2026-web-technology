import h5py
import json

def fix_h5(filepath):
    print(f'Fixing {filepath}')
    try:
        with h5py.File(filepath, 'r+') as f:
            if 'model_config' in f.attrs:
                config_str = f.attrs['model_config']
                config_str = config_str.decode('utf-8') if isinstance(config_str, bytes) else config_str
                config = json.loads(config_str)
                changed = False
                for layer in config.get('config', {}).get('layers', []):
                    if 'config' in layer and 'quantization_config' in layer['config']:
                        del layer['config']['quantization_config']
                        changed = True
                if changed:
                    new_config_str = json.dumps(config)
                    f.attrs['model_config'] = new_config_str.encode('utf-8')
                    print(f'Fixed quantization_config in {filepath}')
                else:
                    print('No quantization_config found.')
            else:
                print('No model_config found.')
    except Exception as e:
        print(f'Error: {e}')

import os
base_dir = r"d:\.TA_heigel\skrining_tbc\backend_skrining_tbc\app\ml_models"
for file in ["model_custom4_cnn.h5", "model_densenet.h5"]:
    fix_h5(os.path.join(base_dir, file))
