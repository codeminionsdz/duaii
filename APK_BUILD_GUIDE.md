# 📱 دليل تحديث تطبيق APK - النسخة 1.5.0+

## 📋 الخطوات السريعة لبناء APK جديد

### الخطوة 1️⃣: تحديث أرقام النسخ

#### في `package.json`:
```json
{
  "name": "duaiii-test",
  "version": "1.5.0",  // ✅ حدّث هنا
  ...
}
```

#### في `android/app/build.gradle`:
```gradle
android {
    ...
    defaultConfig {
        applicationId "com.duaiii.app"
        minSdkVersion 24
        targetSdkVersion 34
        versionCode 3          // ✅ حدّث: كان 1، الآن 3
        versionName "1.5.0"    // ✅ حدّث: كان "1.0"، الآن "1.5.0"
        ...
    }
}
```

---

### الخطوة 2️⃣: بناء APK

#### الطريقة الأولى: عبر Android Studio (الأسهل)

```bash
# 1. افتح المشروع في Android Studio
#    File → Open → android/

# 2. في القائمة العلوية:
#    Build → Build Bundle(s)/APK(s) → Build APK(s)

# 3. اختر Release أو Debug حسب احتياجك

# 4. سيتم حفظ APK في:
#    android/app/build/outputs/apk/release/app-release.apk
```

#### الطريقة الثانية: عبر Gradle (Command Line)

```bash
cd android

# بناء Debug APK (للاختبار):
./gradlew assembleDebug

# بناء Release APK (للنشر):
./gradlew assembleRelease
```

#### الطريقة الثالثة: عبر Capacitor (متقدمة)

```bash
# من جذر المشروع:

# 1. بناء موارد الويب
npm run build

# 2. نسخ الموارد إلى Android
npx cap copy android

# 3. فتح Android Studio
npx cap open android

# 4. من Android Studio:
#    Build → Build Bundle(s)/APK(s) → Build APK(s)
```

---

### الخطوة 3️⃣: التحقق من الملف المبني

```bash
# التحقق من وجود الملف
ls -la android/app/build/outputs/apk/release/

# يجب أن ترى:
# -rw-r--r-- app-release.apk (حوالي 50-100 MB)
```

---

### الخطوة 4️⃣: اختبار APK على جهاز

#### عبر Android Studio:
```
Run → Select Device → Run
```

#### عبر ADB (Command Line):
```bash
# توصيل الهاتف عبر USB وتفعيل Developer Mode

# تثبيت APK:
adb install android/app/build/outputs/apk/release/app-release.apk

# التحقق من التثبيت:
adb shell pm list packages | grep duaiii
```

---

## 🔧 الإعدادات الهامة

### capacitor.config.ts:
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.duaiii.app',           // معرّف فريد للتطبيق
  appName: 'duaii',                  // اسم التطبيق
  webDir: 'dist',                    // مجلد الويب المبني (بعد npm run build)
  server: {
    url: 'https://duaiinow.vercel.app',  // رابط الخادم
    cleartext: false,
  },
};

export default config;
```

### AndroidManifest.xml:
```xml
✅ جميع الأذونات المطلوبة موجودة:
   - INTERNET
   - ACCESS_FINE_LOCATION
   - ACCESS_COARSE_LOCATION
   - POST_NOTIFICATIONS

✅ الأيقونات موجودة في:
   - android/app/src/main/res/mipmap-*/ic_launcher.png
```

---

## 📊 حالة APK الحالية

| العنصر | القيمة |
|--------|--------|
| معرّف التطبيق | com.duaiii.app |
| اسم التطبيق | duaii |
| الإصدار الحالي | 1.0 |
| رقم الإصدار | versionCode: 1 |
| الحد الأدنى SDK | 24 (Android 7.0) |
| الحد الأقصى SDK | 34 (Android 14) |
| حجم التطبيق المتوقع | 50-100 MB |

---

## ✅ قائمة تحقق قبل البناء

- [ ] تحديث `versionCode` في `build.gradle`
- [ ] تحديث `versionName` في `build.gradle`
- [ ] تحديث `version` في `package.json`
- [ ] تنفيذ `npm run build` لبناء الموارد
- [ ] تنفيذ `npx cap copy android` لنسخ الموارد
- [ ] التحقق من وجود أيقونات التطبيق
- [ ] التحقق من الأذونات في AndroidManifest.xml
- [ ] اختبار APK على جهاز فعلي

---

## 🚀 الخطوات التالية بعد الإنشاء

### 1. الاختبار:
```bash
# تثبيت على جهاز الاختبار
adb install app-release.apk

# اختبار جميع الميزات:
✅ تسجيل الدخول
✅ التحليلات
✅ الموقع الجغرافي
✅ الإشعارات
✅ عرض الوصفات والصيدليات
```

### 2. النشر على Google Play:
```bash
# إنشاء حساب مطور Google Play
# https://play.google.com/console

# تحميل APK أو AAB
# أضف الوصف والصور والكلمات الرئيسية
# انتظر المراجعة (عادة 2-4 ساعات)
```

### 3. النشر على متجر بديل:
```bash
# AppGallery (Huawei)
# Amazon Appstore
# Samsung Galaxy Store
# أو أي متجر آخر
```

---

## 🐛 استكشاف الأخطاء

### الخطأ: "Failed to find SDK"
```bash
# الحل:
export ANDROID_HOME=/path/to/Android/Sdk
./gradlew --version
```

### الخطأ: "Gradle build failed"
```bash
# الحل:
cd android
./gradlew clean
./gradlew build
```

### الخطأ: "Resource not found"
```bash
# الحل:
npm run build
npx cap copy android
npx cap sync android
```

---

## 📝 الملفات المهمة

```
android/
├── app/
│   ├── build.gradle              ← تحديث versionCode و versionName هنا
│   ├── src/
│   │   └── main/
│   │       ├── AndroidManifest.xml
│   │       └── res/
│   │           └── mipmap-*/     ← أيقونات التطبيق
│   └── build/
│       └── outputs/apk/          ← APK النهائي هنا
├── build.gradle
└── gradle.properties

capacitor.config.ts              ← تحديث الإعدادات هنا
package.json                      ← تحديث version هنا
```

---

## 💡 نصائح مهمة

✅ **استخدم Release APK للنشر:**
- أصغر حجماً من Debug
- أسرع وأكثر أماناً
- يتطلب signing key

✅ **حافظ على Signing Key:**
```bash
# إنشاء مفتاح توقيع (مرة واحدة فقط):
keytool -genkey -v -keystore duaii-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias duaii-key

# حفظ الملف بأمان ولا تفقده!
```

✅ **اختبر دائماً قبل النشر:**
- اختبر على أجهزة مختلفة
- اختبر على إصدارات Android مختلفة
- اختبر الميزات الرئيسية

---

**تم الانتهاء! 🎉**

اتبع الخطوات أعلاه وستتمكن من بناء APK جديد بسهولة.

للمساعدة الإضافية، راجع:
- [Capacitor Documentation](https://capacitorjs.com/docs/android)
- [Android Developer Guide](https://developer.android.com/guide)
