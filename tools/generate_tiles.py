"""
Generates high-fidelity dithered SVG tiles for Zyntis Group interactive canvases.
Each tile consists of a grid of tiny <rect> elements forming crisp tech iconography.
"""
import math
import os

OUTPUT_DIR = r"d:\side job\website dev\zyntis group\assets"
os.makedirs(OUTPUT_DIR, exist_ok=True)

WIDTH, HEIGHT = 600, 600
GRID = 75 # 75x75 grid of dots = up to 5,625 points
STEP = WIDTH / GRID
DOT_SIZE = STEP * 0.72

def render_svg(dots, filename):
    rects = []
    for x, y in dots:
        rects.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{DOT_SIZE:.1f}" height="{DOT_SIZE:.1f}" fill="#1b1b18" />')
    
    content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}">
  <g class="tile-dots">
    {''.join(rects)}
  </g>
</svg>'''
    filepath = os.path.join(OUTPUT_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Generated {filename} with {len(dots)} dots.")

# 1. Tile 1: AI Agent & Neural Core
def generate_tile_agent():
    dots = []
    cx, cy = WIDTH / 2, HEIGHT / 2
    for i in range(GRID):
        for j in range(GRID):
            x = i * STEP
            y = j * STEP
            dx = (x - cx) / (WIDTH * 0.42)
            dy = (y - cy) / (HEIGHT * 0.42)
            r = math.hypot(dx, dy)
            
            # Rounded squircle boundary
            squircle = (dx**4 + dy**4)
            if squircle > 1.1:
                continue
                
            # Outer boundary border
            is_border = 0.95 <= squircle <= 1.08
            
            # Neural core concentric rings
            is_core = r < 0.22
            is_ring1 = 0.35 < r < 0.42 and (math.atan2(dy, dx) % (math.pi/3) > 0.3)
            is_ring2 = 0.55 < r < 0.62 and (math.atan2(dy, dx) % (math.pi/4) > 0.25)
            
            # Radiating connection lines
            angle = math.atan2(dy, dx)
            is_ray = False
            for k in range(8):
                target_a = k * (math.pi / 4)
                if abs(angle - target_a) < 0.08 and 0.2 < r < 0.88:
                    is_ray = True
                    break
                    
            # Stylized 'Z' inside core
            is_z = False
            if abs(dx) < 0.16 and abs(dy) < 0.16:
                if (abs(dy - 0.12) < 0.03) or (abs(dy + 0.12) < 0.03) or (abs(dx + dy) < 0.035):
                    is_z = True
            
            # Dither pattern fill
            dither_bg = ((i + j) % 2 == 0) and squircle < 0.9 and (i % 3 == 0 or j % 3 == 0)

            if is_border or is_core or is_ring1 or is_ring2 or is_ray or is_z or dither_bg:
                dots.append((x, y))
                
    render_svg(dots, "tile-agent.svg")

# 2. Tile 2: Connected Automation Flow
def generate_tile_workflow():
    dots = []
    cx, cy = WIDTH / 2, HEIGHT / 2
    for i in range(GRID):
        for j in range(GRID):
            x = i * STEP
            y = j * STEP
            dx = (x - cx) / (WIDTH * 0.42)
            dy = (y - cy) / (HEIGHT * 0.42)
            squircle = (dx**4 + dy**4)
            if squircle > 1.1:
                continue
                
            is_border = 0.95 <= squircle <= 1.08
            
            # 3-tier pipeline flow
            # Top node (Lead capture)
            n1 = math.hypot(dx + 0.45, dy + 0.35) < 0.24
            # Middle node (AI Qualification)
            n2 = math.hypot(dx, dy) < 0.28
            # Bottom node (CRM & Calendar)
            n3 = math.hypot(dx - 0.45, dy - 0.35) < 0.24
            
            # Connecting pipeline bus
            is_pipe1 = abs((dy + 0.35) - 0.77 * (dx + 0.45)) < 0.06 and (-0.45 <= dx <= 0)
            is_pipe2 = abs((dy) - 0.77 * (dx)) < 0.06 and (0 <= dx <= 0.45)
            
            # Flow chevrons
            is_chevron = False
            for step_x in [-0.22, 0.22]:
                if abs(dx - step_x) < 0.12 and abs(dy - (0.77*step_x)) < 0.08:
                    if abs(abs(dx - step_x) - abs(dy - (0.77*step_x))) < 0.04:
                        is_chevron = True
                        
            # Dither accents
            dither = ((i * 3 + j * 7) % 11 == 0) and squircle < 0.92
            
            if is_border or n1 or n2 or n3 or is_pipe1 or is_pipe2 or is_chevron or dither:
                dots.append((x, y))
                
    render_svg(dots, "tile-workflow.svg")

# 3. Tile 3: Integrated Business Ecosystem
def generate_tile_system():
    dots = []
    cx, cy = WIDTH / 2, HEIGHT / 2
    for i in range(GRID):
        for j in range(GRID):
            x = i * STEP
            y = j * STEP
            dx = (x - cx) / (WIDTH * 0.42)
            dy = (y - cy) / (HEIGHT * 0.42)
            squircle = (dx**4 + dy**4)
            if squircle > 1.1:
                continue
                
            is_border = 0.95 <= squircle <= 1.08
            
            # Isometric central hub
            # Isometric diamond
            iso_d = abs(dx) + abs(dy * 1.3)
            is_hub = iso_d < 0.38 and ((i + j) % 2 == 0)
            is_hub_edge = abs(iso_d - 0.38) < 0.04
            
            # Satellite nodes (Web, CRM, Calendar, DB)
            s1 = math.hypot(dx - 0.55, dy) < 0.14
            s2 = math.hypot(dx + 0.55, dy) < 0.14
            s3 = math.hypot(dx, dy - 0.55) < 0.14
            s4 = math.hypot(dx, dy + 0.55) < 0.14
            
            # Cross linkages
            is_link = (abs(dy) < 0.035 and abs(dx) < 0.55) or (abs(dx) < 0.035 and abs(dy) < 0.55)
            
            # Ambient tech matrix
            dither = ((i % 4 == 0) and (j % 4 == 0)) and squircle < 0.9
            
            if is_border or is_hub or is_hub_edge or s1 or s2 or s3 or s4 or is_link or dither:
                dots.append((x, y))
                
    render_svg(dots, "tile-system.svg")

if __name__ == "__main__":
    generate_tile_agent()
    generate_tile_workflow()
    generate_tile_system()
