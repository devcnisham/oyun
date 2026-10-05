import os
import glob
import re

replacements = {
    "--green-": "--primary-",
    "shadow-green": "shadow-primary",
    "badge--green": "badge--primary",
    "dot--green": "dot--primary",
    "pulse-green": "pulse-primary",
    "rgba(26, 92, 56, 0.06)": "rgba(0, 0, 0, 0.03)",
    "rgba(26, 92, 56, 0.035)": "rgba(0, 0, 0, 0.025)",
    "rgba(26, 92, 56, 0.25)": "rgba(0, 0, 0, 0.18)",
    "rgba(26, 92, 56, 0.28)": "rgba(0, 0, 0, 0.22)",
    "rgba(26, 92, 56, 0.18)": "rgba(0, 0, 0, 0.14)",
    "rgba(26, 92, 56, 0.3)": "rgba(0, 0, 0, 0.18)",
    "rgba(26, 92, 56, 0.2)": "rgba(0, 0, 0, 0.12)",
    "rgba(26, 92, 56, 0.35)": "rgba(0, 0, 0, 0.2)",
    "rgba(26,92,56,0.25)": "rgba(0,0,0,0.18)",
    "rgba(26,92,56,0.3)": "rgba(0,0,0,0.18)",
    "rgba(26,92,56,0.2)": "rgba(0,0,0,0.12)",
    "rgba(42, 132, 85, 0.1)": "rgba(0, 0, 0, 0.08)",
    "rgba(42,132,85,0.1)": "rgba(0,0,0,0.08)",
    "#1A5C38": "var(--primary-700)",
    "#206B42": "var(--primary-600)",
    "#2A8455": "var(--primary-500)",
    "#3AA668": "var(--primary-400)",
    "#0D3320": "var(--primary-900)",
    "#145230": "var(--primary-800)",
}

for filepath in glob.glob('src/**/*', recursive=True):
    if filepath.endswith('.css') or filepath.endswith('.tsx'):
        with open(filepath, 'r') as f:
            content = f.read()
        
        new_content = content
        for k, v in replacements.items():
            new_content = new_content.replace(k, v)
            
        if new_content != content:
            with open(filepath, 'w') as f:
                f.write(new_content)
            print(f"Updated {filepath}")

