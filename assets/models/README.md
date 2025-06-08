# نماذج الذكاء الاصطناعي - Nova Edit

## النماذج المحلية:
- Body Segmentation (TensorFlow.js)
- Face Landmarks (MediaPipe)
- Speech to Text (Web Speech API)

## التحسين:
- النماذج محسنة للموبايل
- تحميل lazy للنماذج الكبيرة
- استخدام WebGL للتسريع

## الاستخدام:
```javascript
import { loadModel } from '../services/AIProcessingService';

const model = await loadModel('bodySegmentation');
```

## ملاحظات:
- النماذج تحمل عند الحاجة فقط
- استخدام cache لتجنب إعادة التحميل
- fallback للمعالجة CPU إذا لم يتوفر GPU
