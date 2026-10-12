import os
from PIL import Image, ImageDraw

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "sketches")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def draw_house(draw: ImageDraw.ImageDraw):
    # Main house box
    draw.rectangle([140, 200, 360, 420], outline=0, width=4)
    # Roof triangle
    draw.polygon([(110, 200), (250, 90), (390, 200)], outline=0, fill=None)
    # Chimney
    draw.rectangle([320, 110, 350, 170], outline=0, width=3)
    # Door
    draw.rectangle([220, 310, 280, 420], outline=0, width=3)
    draw.ellipse([270, 365, 275, 370], fill=0)
    # Windows
    draw.rectangle([165, 230, 215, 280], outline=0, width=3)
    draw.line([(190, 230), (190, 280)], fill=0, width=2)
    draw.line([(165, 255), (215, 255)], fill=0, width=2)
    draw.rectangle([285, 230, 335, 280], outline=0, width=3)
    draw.line([(310, 230), (310, 280)], fill=0, width=2)
    draw.line([(285, 255), (335, 255)], fill=0, width=2)


def draw_face(draw: ImageDraw.ImageDraw):
    # Head contour
    draw.ellipse([160, 100, 340, 380], outline=0, width=4)
    # Eyes
    draw.ellipse([200, 190, 230, 215], outline=0, width=3)
    draw.ellipse([270, 190, 300, 215], outline=0, width=3)
    draw.ellipse([210, 200, 220, 210], fill=0)
    draw.ellipse([280, 200, 290, 210], fill=0)
    # Nose
    draw.line([(250, 215), (245, 260), (260, 260)], fill=0, width=3)
    # Smile
    draw.arc([210, 280, 290, 330], start=10, end=170, fill=0, width=3)
    # Hair
    draw.arc([140, 60, 360, 220], start=190, end=350, fill=0, width=5)


def draw_car(draw: ImageDraw.ImageDraw):
    # Body lower
    draw.rectangle([80, 260, 420, 340], outline=0, width=4)
    # Cabin roof
    draw.polygon([(160, 260), (200, 180), (340, 180), (380, 260)], outline=0, fill=None)
    # Windows
    draw.polygon([(175, 250), (205, 195), (260, 195), (260, 250)], outline=0, fill=None)
    draw.polygon([(275, 250), (275, 195), (330, 195), (365, 250)], outline=0, fill=None)
    # Wheels
    draw.ellipse([130, 310, 200, 380], fill=255, outline=0, width=5)
    draw.ellipse([155, 335, 175, 355], fill=0)
    draw.ellipse([300, 310, 370, 380], fill=255, outline=0, width=5)
    draw.ellipse([325, 335, 345, 355], fill=0)


def draw_ui_wireframe(draw: ImageDraw.ImageDraw):
    # Browser window outline
    draw.rectangle([60, 80, 440, 420], outline=0, width=3)
    # Navbar
    draw.rectangle([60, 80, 440, 130], outline=0, width=2)
    # Logo box
    draw.rectangle([80, 95, 120, 115], outline=0, width=2)
    # Nav links
    draw.line([(150, 105), (190, 105)], fill=0, width=2)
    draw.line([(210, 105), (250, 105)], fill=0, width=2)
    # Avatar circle
    draw.ellipse([400, 95, 420, 115], outline=0, width=2)
    # Hero card
    draw.rectangle([90, 160, 410, 270], outline=0, width=2)
    # Hero CTA button
    draw.rectangle([110, 230, 200, 255], outline=0, width=2)
    # Cards grid below
    draw.rectangle([90, 300, 235, 390], outline=0, width=2)
    draw.rectangle([265, 300, 410, 390], outline=0, width=2)


def draw_cat(draw: ImageDraw.ImageDraw):
    # Head
    draw.ellipse([175, 150, 325, 300], outline=0, width=4)
    # Ears
    draw.polygon([(185, 180), (160, 80), (225, 155)], outline=0, fill=None)
    draw.polygon([(315, 180), (340, 80), (275, 155)], outline=0, fill=None)
    # Eyes
    draw.ellipse([205, 210, 225, 240], fill=0)
    draw.ellipse([275, 210, 295, 240], fill=0)
    # Nose
    draw.polygon([(245, 250), (255, 250), (250, 260)], fill=0)
    # Whiskers
    draw.line([(160, 250), (230, 255)], fill=0, width=2)
    draw.line([(160, 265), (230, 265)], fill=0, width=2)
    draw.line([(270, 255), (340, 250)], fill=0, width=2)
    draw.line([(270, 265), (340, 265)], fill=0, width=2)
    # Body
    draw.ellipse([150, 280, 350, 440], outline=0, width=4)


def draw_mug(draw: ImageDraw.ImageDraw):
    # Mug cylinder
    draw.rectangle([160, 160, 320, 380], outline=0, width=4)
    # Bottom ellipse
    draw.arc([160, 360, 320, 400], start=0, end=180, fill=0, width=4)
    # Rim ellipse
    draw.ellipse([160, 140, 320, 180], outline=0, width=4)
    # Handle
    draw.arc([290, 200, 380, 340], start=270, end=90, fill=0, width=5)
    # Steam waves
    draw.arc([200, 70, 240, 130], start=180, end=360, fill=0, width=2)
    draw.arc([240, 50, 280, 110], start=0, end=180, fill=0, width=2)


def draw_mountain(draw: ImageDraw.ImageDraw):
    # Sun
    draw.ellipse([300, 90, 380, 170], outline=0, width=3)
    # Mountain 1
    draw.polygon([(60, 420), (220, 160), (380, 420)], outline=0, fill=None)
    # Snowcap
    draw.polygon([(180, 225), (220, 160), (260, 225), (240, 240), (220, 230), (200, 240)], fill=0)
    # Mountain 2
    draw.polygon([(260, 420), (360, 230), (450, 420)], outline=0, fill=None)
    # Horizon line
    draw.line([(30, 420), (470, 420)], fill=0, width=3)


def draw_tree(draw: ImageDraw.ImageDraw):
    # Trunk
    draw.rectangle([225, 280, 275, 430], outline=0, width=4)
    # Canopy circles
    draw.ellipse([130, 100, 370, 320], outline=0, width=4)
    draw.arc([120, 160, 260, 300], start=90, end=270, fill=0, width=3)
    draw.arc([240, 160, 380, 300], start=270, end=90, fill=0, width=3)


def draw_chair(draw: ImageDraw.ImageDraw):
    # Backrest
    draw.rectangle([160, 80, 340, 260], outline=0, width=4)
    # Cushion seat
    draw.rectangle([140, 260, 360, 320], outline=0, width=4)
    # Legs
    draw.line([(160, 320), (150, 430)], fill=0, width=4)
    draw.line([(340, 320), (350, 430)], fill=0, width=4)
    draw.line([(190, 320), (190, 410)], fill=0, width=3)
    draw.line([(310, 320), (310, 410)], fill=0, width=3)


def draw_boat(draw: ImageDraw.ImageDraw):
    # Hull
    draw.polygon([(80, 330), (140, 410), (360, 410), (420, 330)], outline=0, fill=None)
    # Mast
    draw.line([(260, 100), (260, 330)], fill=0, width=4)
    # Main sail
    draw.polygon([(270, 110), (270, 310), (390, 310)], outline=0, fill=None)
    # Jib sail
    draw.polygon([(250, 130), (250, 310), (150, 310)], outline=0, fill=None)
    # Water ripples
    draw.arc([60, 420, 160, 450], start=0, end=180, fill=0, width=2)
    draw.arc([160, 420, 260, 450], start=0, end=180, fill=0, width=2)
    draw.arc([260, 420, 360, 450], start=0, end=180, fill=0, width=2)


SKETCH_GENERATORS = {
    "house.png": ("A cozy stone cottage in autumn woods with smoke from chimney", draw_house),
    "face.png": ("Portrait of a cheerful young woman with curly hair", draw_face),
    "car.png": ("Sleek modern red electric sports car speeding on highway", draw_car),
    "ui_wireframe.png": ("Clean SaaS analytics dashboard interface with widgets and cards", draw_ui_wireframe),
    "cat.png": ("Fluffy ginger cat sitting gracefully on velvet cushion", draw_cat),
    "mug.png": ("Artisan ceramic coffee mug filled with fresh steaming latte", draw_mug),
    "mountain.png": ("Majestic snow-capped alpine mountains under golden sunrise", draw_mountain),
    "tree.png": ("Ancient grand oak tree standing in a vibrant green meadow", draw_tree),
    "chair.png": ("Mid-century modern minimalist armchair in stylish living room", draw_chair),
    "boat.png": ("White sailboat gliding across calm azure ocean water", draw_boat),
}


def generate_all_sketches():
    print(f"Generating test sketch dataset in {OUTPUT_DIR}...")
    for filename, (prompt, drawer) in SKETCH_GENERATORS.items():
        img = Image.new("RGB", (512, 512), color=(255, 255, 255))
        draw = ImageDraw.Draw(img)
        drawer(draw)
        path = os.path.join(OUTPUT_DIR, filename)
        img.save(path, format="PNG")
        print(f"  [OK] Created {filename}")
    print("All 10 test sketches generated successfully.")


if __name__ == "__main__":
    generate_all_sketches()
