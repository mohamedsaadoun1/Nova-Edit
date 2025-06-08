#!/bin/bash

# 📱 سكريبت مساعد لإعداد Nova Edit على الموبايل
# يسهل عملية التحويل إلى APK خطوة بخطوة

echo "🚀 مرحباً بك في مساعد إعداد Nova Edit للموبايل"
echo "=================================================="

# فحص البيئة
echo "🔍 فحص البيئة الحالية..."

# التحقق من وجود Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js متوفر - الإصدار: $NODE_VERSION"
else
    echo "❌ Node.js غير متوفر"
    echo "📝 قم بتثبيته باستخدام: pkg install nodejs"
    exit 1
fi

# التحقق من وجود npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm متوفر - الإصدار: $NPM_VERSION"
else
    echo "❌ npm غير متوفر"
    echo "📝 قم بتثبيته باستخدام: pkg install npm"
    exit 1
fi

# التحقق من وجود git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    echo "✅ git متوفر - $GIT_VERSION"
else
    echo "⚠️  git غير متوفر - قد تحتاجه لتحميل المشروع"
    echo "📝 قم بتثبيته باستخدام: pkg install git"
fi

echo ""
echo "📋 خطوات الإعداد التلقائي:"
echo "=========================="

# الخطوة 1: تثبيت Expo CLI
echo "1️⃣ تثبيت Expo CLI..."
if command -v expo &> /dev/null; then
    echo "✅ Expo CLI متوفر بالفعل"
else
    echo "📦 جاري تثبيت Expo CLI..."
    npm install -g @expo/cli eas-cli
    if [ $? -eq 0 ]; then
        echo "✅ تم تثبيت Expo CLI بنجاح"
    else
        echo "❌ فشل في تثبيت Expo CLI"
        exit 1
    fi
fi

# الخطوة 2: التحقق من مجلد المشروع
echo ""
echo "2️⃣ التحقق من مجلد المشروع..."

if [ -f "package.json" ]; then
    echo "✅ ملف package.json موجود"
    
    # التحقق من نوع المشروع
    if grep -q "expo" package.json; then
        echo "✅ مشروع Expo مُكتشف"
    else
        echo "⚠️  قد لا يكون هذا مشروع Expo صحيح"
    fi
else
    echo "❌ ملف package.json غير موجود"
    echo "📝 تأكد من وجودك في مجلد Nova Edit الصحيح"
    exit 1
fi

# الخطوة 3: تثبيت التبعيات
echo ""
echo "3️⃣ تثبيت تبعيات المشروع..."

if [ -d "node_modules" ]; then
    echo "📦 node_modules موجود، جاري التحقق من التحديثات..."
    npm update
else
    echo "📦 جاري تثبيت التبعيات..."
    npm install
fi

if [ $? -eq 0 ]; then
    echo "✅ تم تثبيت التبعيات بنجاح"
else
    echo "❌ فشل في تثبيت التبعيات"
    echo "💡 جرب: npm install --legacy-peer-deps"
    exit 1
fi

# الخطوة 4: التحقق من قدرة العمل بدون إنترنت
echo ""
echo "4️⃣ التحقق من قدرة العمل بدون إنترنت..."

if [ -f "scripts/verify-offline-capability.js" ]; then
    node scripts/verify-offline-capability.js
    if [ $? -eq 0 ]; then
        echo "✅ التطبيق جاهز للعمل بدون إنترنت"
    else
        echo "⚠️  قد تحتاج لبعض الإصلاحات قبل البناء"
    fi
else
    echo "⚠️  سكريبت التحقق غير موجود"
fi

# الخطوة 5: تحضير ملفات التحسين
echo ""
echo "5️⃣ تحضير ملفات التحسين..."

# نسخ ملفات التحسين إذا لم تكن موجودة
if [ -f "metro.config.optimized.js" ] && [ ! -f "metro.config.js" ]; then
    echo "📝 نسخ metro.config محسن..."
    cp metro.config.optimized.js metro.config.js
    echo "✅ تم نسخ metro.config.js"
fi

if [ -f "android/app/build.gradle.optimized" ]; then
    echo "📝 ملف build.gradle محسن متوفر"
    echo "💡 لتطبيقه: cp android/app/build.gradle.optimized android/app/build.gradle"
fi

# الخطوة 6: معلومات البناء
echo ""
echo "🏗️ معلومات البناء:"
echo "=================="

echo "📱 لبناء APK باستخدام EAS Build:"
echo "   1. expo login (أو expo register للتسجيل)"
echo "   2. eas build:configure"
echo "   3. eas build --platform android --profile preview"

echo ""
echo "🖥️ لبناء APK محلياً (يحتاج Android SDK):"
echo "   1. تطبيق ملفات التحسين"
echo "   2. npm run build:android:apk"

echo ""
echo "⚡ للتجربة السريعة:"
echo "   1. expo start"
echo "   2. فتح Expo Go وتصوير QR code"

# الخطوة 7: معلومات إضافية
echo ""
echo "ℹ️  معلومات إضافية:"
echo "==================="

# معلومات حجم المشروع
if [ -d "node_modules" ]; then
    NODE_MODULES_SIZE=$(du -sh node_modules 2>/dev/null | cut -f1)
    echo "📦 حجم node_modules: $NODE_MODULES_SIZE"
fi

# معلومات حجم الأصول
if [ -d "assets" ]; then
    ASSETS_SIZE=$(du -sh assets 2>/dev/null | cut -f1)
    echo "🖼️  حجم assets: $ASSETS_SIZE"
fi

# معلومات الذاكرة المتاحة
if command -v free &> /dev/null; then
    FREE_MEM=$(free -h | awk '/^Mem:/ {print $7}')
    echo "💾 الذاكرة المتاحة: $FREE_MEM"
fi

# معلومات المساحة المتاحة
DISK_SPACE=$(df -h . | awk 'NR==2 {print $4}')
echo "💽 المساحة المتاحة: $DISK_SPACE"

echo ""
echo "🎯 نصائح مهمة:"
echo "=============="
echo "• استخدم Wi-Fi مستقر لتحميل التبعيات"
echo "• تأكد من شحن البطارية قبل البناء الطويل"
echo "• احتفظ بنسخة احتياطية من المشروع"
echo "• راجع دليل التحويل المفصل للخطوات الكاملة"

echo ""
echo "✨ الإعداد مكتمل! يمكنك الآن بناء APK باستخدام الطرق المذكورة أعلاه."
echo ""
echo "📚 للمزيد من التفاصيل، راجع: دليل_تحويل_APK_من_الموبايل.md"