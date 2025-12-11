# 📱 خطوات بناء APK جديد - سريعة وسهلة

## ⚡ الطريقة الأسرع (عبر Android Studio)

### 1️⃣ التحضير:
```bash
# تأكد من وجود Android Studio و Android SDK

# من جذر المشروع:
npm run build
npx cap copy android
npx cap open android
```

### 2️⃣ البناء:
```
في Android Studio:
1. Build → Build Bundle(s)/APK(s) → Build APK(s)
2. اختر: Release
3. انتظر البناء (2-5 دقائق)
4. اضغط "Locate" لفتح مجلد الملفات
```

### 3️⃣ النتيجة:
```
📁 android/app/build/outputs/apk/release/
└── app-release.apk  ✅ (جاهز للتثبيت)
```

---

## 🔧 الطريقة عبر Command Line (Gradle)

```bash
# فتح مجلد Android
cd android

# بناء Debug APK (للاختبار السريع):
./gradlew assembleDebug

# بناء Release APK (للنشر):
./gradlew assembleRelease
```

---

## 📲 تثبيت على جهازك

### عبر Android Studio:
```
Run → Select Device → Run
```

### عبر ADB:
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

---

## ✅ تم الانتهاء!

تم تحديث أرقام الإصدار:
- ✅ version: 1.5.0 (في package.json)
- ✅ versionCode: 3 (في build.gradle)
- ✅ versionName: 1.5.0 (في build.gradle)

**اتبع الخطوات أعلاه وستحصل على APK جديد! 🎉**

---

للمزيد من التفاصيل:
👉 اقرأ `APK_BUILD_GUIDE.md`
