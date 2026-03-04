from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    for y in range(size):
        for x in range(size):
            r = int(102 + (118 - 102) * ((x + y) / (2 * size)))
            g = int(126 + (75 - 126) * ((x + y) / (2 * size)))
            b = int(234 + (162 - 234) * ((x + y) / (2 * size)))
            draw.point((x, y), (r, g, b, 255))
    
    try:
        font_large = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", int(size * 0.4))
        font_small = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", int(size * 0.1))
    except:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    text = "MD"
    bbox = draw.textbbox((0, 0), text, font=font_large)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (size - text_width) / 2
    y = size * 0.55 - text_height / 2
    draw.text((x, y), text, font=font_large, fill=(255, 255, 255, 255))
    
    text2 = "ChatGPT"
    bbox2 = draw.textbbox((0, 0), text2, font=font_small)
    text_width2 = bbox2[2] - bbox2[0]
    text_height2 = bbox2[3] - bbox2[1]
    x2 = (size - text_width2) / 2
    y2 = size * 0.75 - text_height2 / 2
    draw.text((x2, y2), text2, font=font_small, fill=(255, 255, 255, 200))
    
    img.save(f'icon{size}.png')
    print(f'Created icon{size}.png')

if __name__ == '__main__':
    for size in [16, 48, 128]:
        create_icon(size)
    print('All icons created successfully!')