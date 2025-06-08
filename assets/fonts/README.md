# خطوط Nova Edit المحلية

## الخطوط المتوفرة:
- Roboto (الافتراضي)
- Inter (حديث)
- Cairo (عربي)
- Amiri (عربي كلاسيكي)

## التحسين:
- استخدم صيغة WOFF2 للويب
- استخدم TTF للموبايل
- تم تحسين الخطوط العربية للشاشات الصغيرة

## الاستخدام:
```javascript
import { useFonts } from 'expo-font';

const [fontsLoaded] = useFonts({
  'Cairo-Regular': require('./assets/fonts/Cairo-Regular.ttf'),
  'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
});
```
