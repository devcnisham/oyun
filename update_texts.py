import os

filepath = 'src/app/page.tsx'
with open(filepath, 'r') as f:
    content = f.read()

replacements = {
    "Now live in Mangalore": "Beta Live in Mangalore",
    "in Mangalore\n            </h1>": "\n            </h1>",
    "across Mangalore": "near you",
    "Mangalore city": "our launch cities",
    "Own a turf in Mangalore?": "Own a sports turf?",
    "What Mangalore says": "What Players Say",
    "turfs in Mangalore": "turfs near you",
    "football players near you": "players near you",
    "font-family: 'Outfit', sans-serif;": "font-family: 'Inter', system-ui, sans-serif;"
}

for k, v in replacements.items():
    content = content.replace(k, v)

with open(filepath, 'w') as f:
    f.write(content)

# Also update fonts and radius in globals.css
globals_path = 'src/app/globals.css'
with open(globals_path, 'r') as f:
    globals_content = f.read()

globals_content = globals_content.replace(
    "font-family: 'Outfit', sans-serif;", 
    "font-family: 'Inter', system-ui, sans-serif;"
)
globals_content = globals_content.replace(
    "--radius-sm: 8px;", "--radius-sm: 4px;"
)
globals_content = globals_content.replace(
    "--radius-md: 12px;", "--radius-md: 6px;"
)
globals_content = globals_content.replace(
    "--radius-lg: 16px;", "--radius-lg: 8px;"
)
globals_content = globals_content.replace(
    "--radius-xl: 24px;", "--radius-xl: 12px;"
)

with open(globals_path, 'w') as f:
    f.write(globals_content)

print("Texts and design tokens updated successfully.")
