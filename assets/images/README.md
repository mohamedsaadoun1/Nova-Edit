# صور Nova Edit المحلية

## التحسين:
- استخدم convert-to-webp.sh لتحويل الصور لـ WebP
- WebP يوفر ضغط أفضل بنسبة 25-35%
- احتفظ بالصور الأصلية كنسخة احتياطية

## الاستخدام:
```bash
cd assets/images
chmod +x convert-to-webp.sh
./convert-to-webp.sh
```

## صيغ مدعومة:
- PNG, JPG, JPEG → WebP
- SVG (بدون تحويل، محسن بالفعل)
- GIF (للأنيميشن فقط)
