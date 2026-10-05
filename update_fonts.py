import os
import glob

replacements = {
    "font-family: 'Outfit', sans-serif;": "font-family: 'Inter', system-ui, sans-serif;",
    "font-family: 'Outfit', monospace;": "font-family: 'Inter', monospace;",
}

for filepath in glob.glob('src/**/*.css', recursive=True):
    with open(filepath, 'r') as f:
        content = f.read()
    
    new_content = content
    for k, v in replacements.items():
        new_content = new_content.replace(k, v)
        
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated font in {filepath}")

