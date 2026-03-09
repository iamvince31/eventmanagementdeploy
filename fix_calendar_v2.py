#!/usr/bin/env python3
import os

# Read the file
file_path = 'frontend/src/components/Calendar.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find and remove the duplicate lines (lines 166-173 based on diagnostics)
# We need to keep only one declaration of regularEvents
new_lines = []
skip_until = -1

for i, line in enumerate(lines):
    line_num = i + 1
    
    # Skip lines 166-172 (the first declaration and unused variables)
    if line_num == 166 and 'const dayEvents' in line:
        # Start of problematic section - replace with clean version
        new_lines.append('      // Get events for this date (only for current month to avoid confusion)\n')
        new_lines.append('      const regularEvents = isCurrentMonth ? getEventsForDate(dateStr) : [];\n')
        new_lines.append('      const academicEvents = isCurrentMonth ? getDefaultEventsForDate(dateStr) : [];\n')
        new_lines.append('      const allEvents = [...academicEvents, ...regularEvents];\n')
        new_lines.append('\n')
        new_lines.append('      // Display limit: show first 3 items (academic events + regular events)\n')
        new_lines.append('      const displayLimit = 3;\n')
        new_lines.append('      const hiddenCount = allEvents.length - displayLimit;\n')
        skip_until = 181  # Skip until after the old section
    elif line_num <= skip_until:
        continue  # Skip these lines
    else:
        new_lines.append(line)

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f'Fixed! Removed duplicate regularEvents declaration.')
print(f'Total lines: {len(lines)} -> {len(new_lines)}')
