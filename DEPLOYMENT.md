# دليل النشر على Vercel

## 🚀 خطوات النشر

### 1. تسجيل الدخول إلى Vercel
- اذهب إلى [Vercel.com](https://vercel.com)
- سجل الدخول باستخدام حسابك (GitHub/GitLab/Bitbucket)

### 2. استيراد المشروع
- اختر "Import Project"
- اختر "Import Git Repository"
- اختر مستودع DUAII من قائمة المستودعات

### 3. إضافة متغيرات البيئة (البالغ أهميتها)
قبل النشر، يجب إضافة متغيرات البيئة التالية:

في صفحة "Configure Project":
1. اذهب إلى **Environment Variables**
2. أضف المتغيرات التالية:

```
NEXT_PUBLIC_SUPABASE_URL = https://nbdytzfnzccwshagzpeu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZHl0emZuemNjd3NoYWd6cGV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTczMzcsImV4cCI6MjA3NjE3MzMzN30.L8WUMHCdj47heGSgd5LUZrC5vBzo1Bug4EYChL9tiHs
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZHl0emZuemNjd3NoYWd6cGV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5NzMzNywiZXhwIjoyMDc2MTczMzM3fQ.iRs7wyWY5Fe07UwgTjOoudb0HUrSJkJjbH02H-lRvI4
```

⚠️ **تحذير:** لا تشارك هذه المفاتيح في العلن. استخدم متغيرات البيئة الآمنة من Vercel فقط.

### 4. اختيار الإعدادات
- Root Directory: `.` (الافتراضي)
- Build Command: `npm run build` (الافتراضي)
- Output Directory: `.next` (الافتراضي)

### 5. النشر
- انقر على "Deploy"
- انتظر حتى يكتمل البناء والنشر

## 🔧 استكشاف الأخطاء

### خطأ: MIDDLEWARE_INVOCATION_FAILED
السبب: متغيرات البيئة غير موجودة أو غير صحيحة.

**الحل:**
1. تحقق من أن جميع متغيرات Supabase موجودة في إعدادات البيئة
2. تحقق من صحة المفاتيح (لا توجد مسافات إضافية)
3. أعد نشر المشروع بعد إضافة المتغيرات

### خطأ: Build fails
السبب: قد يكون هناك مشكلة في الاعتمادايات.

**الحل:**
```bash
npm install
npm run build
```

## 📚 المزيد من المعلومات
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase SSR](https://supabase.com/docs/guides/auth/server-side-rendering)
