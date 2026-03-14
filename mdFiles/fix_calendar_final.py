#!/usr/bin/env python3

# Read the file
with open('frontend/src/components/Calendar.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find and fix the duplicate regularEvents
new_lines = []
skip_mode = False
skip_count = 0

for i, line in enumerate(lines):
    line_num = i + 1
    
    # Start skipping at line 166 (the comment line before first declaration)
    if line_num == 165 and '// Get events for this date' in line:
        # Add the comment
        new_lines.append(line)
        # Add the clean version
        new_lines.append('      const regularEvents = isCurrentMonth ? getEventsForDate(dateStr) : [];\n')
        new_lines.append('      const academicEvents = isCurrentMonth ? getDefaultEventsForDate(dateStr) : [];\n')
        new_lines.append('      const allEvents = [...academicEvents, ...regularEvents];\n')
        new_lines.append('\n')
        new_lines.append('      // Display limit: show first 3 items (academic events + regular events)\n')
        new_lines.append('      const displayLimit = 3;\n')
        new_lines.append('      const hiddenCount = allEvents.length - displayLimit;\n')
        skip_mode = True
        skip_count = 0
    elif skip_mode:
        skip_count += 1
        # Skip the next 15 lines (166-180)
        if skip_count >= 16:
            skip_mode = False
            new_lines.append(line)
    else:
        new_lines.append(line)

# Write back
with open('frontend/src/components/Calendar.jsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('Fixed! Removed duplicate regularEvents declaration.')
print(f'Lines before: {len(lines)}, Lines after: {len(new_lines)}')
