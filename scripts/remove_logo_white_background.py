from collections import deque
from pathlib import Path
import sys
from PIL import Image


source = Path("frontend/public/images/logo-smartpower.png")
destination = Path(sys.argv[1]) if len(sys.argv) > 1 else source
image = Image.open(source).convert("RGBA")
pixels = image.load()
width, height = image.size
queue = deque()
visited = bytearray(width * height)
for x in range(width):
    queue.append((x, 0))
    queue.append((x, height - 1))
for y in range(height):
    queue.append((0, y))
    queue.append((width - 1, y))

# Flood only near-white pixels connected to the image edge. This keeps the
# intentional white circular badge and white roof details inside the emblem.
while queue:
    x, y = queue.popleft()
    index = y * width + x
    if visited[index]:
        continue
    visited[index] = 1
    red, green, blue, alpha = pixels[x, y]
    darkest = min(red, green, blue)
    if darkest < 220 or max(red, green, blue) - darkest > 35:
        continue
    soft_alpha = round(alpha * max(0, min(1, (255 - darkest) / 35)))
    pixels[x, y] = (red, green, blue, soft_alpha)
    if x > 0: queue.append((x - 1, y))
    if x + 1 < width: queue.append((x + 1, y))
    if y > 0: queue.append((x, y - 1))
    if y + 1 < height: queue.append((x, y + 1))
image.save(destination, "PNG", optimize=True)
print(f"Saved transparent logo: {destination} ({image.width}x{image.height})")
