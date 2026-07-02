# LifeFlow AI — بناء تطبيق Android الأصلي

تم تجهيز المشروع بـ **Capacitor** لتحويل PWA إلى تطبيق Android حقيقي مع نظام
تنبيهات أصلي (AlarmManager + Boot Receiver) يعمل حتى عند إغلاق التطبيق.

## متطلبات المرة الأولى (على جهازك المحلي)

1. تثبيت **Android Studio** (Hedgehog أو أحدث) — https://developer.android.com/studio
2. تثبيت **Java JDK 17** و**Android SDK 34** (Android Studio يتكفّل بهما).
3. متغيّر البيئة `ANDROID_HOME` يشير إلى مجلد SDK.

## خطوات البناء

```bash
# 1. اسحب الكود من Lovable (Git)
git clone <your-repo> && cd <your-repo>
bun install

# 2. أضف منصّة Android (مرّة واحدة فقط)
bun run android:init

# 3. ابنِ الويب + انسخ الأصول إلى مشروع Android
bun run android:sync

# 4. افتح المشروع في Android Studio
bun run android:open
```

ثم من Android Studio: **Run ▶️** لتثبيت التطبيق على جهاز/محاكي، أو
**Build → Generate Signed Bundle / APK** لإنتاج ملف قابل للنشر على Google Play.

## أذونات Android المطلوبة

أضف هذه الأسطر إلى `android/app/src/main/AndroidManifest.xml` داخل وسم `<manifest>`
(بعد أن تولّد المنصة في الخطوة 2):

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM"/>
<uses-permission android:name="android.permission.USE_EXACT_ALARM"/>
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
<uses-permission android:name="android.permission.WAKE_LOCK"/>
<uses-permission android:name="android.permission.VIBRATE"/>
<uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS"/>
<uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT"/>
```

> **مهم:** إضافة صلاحيتَي `SCHEDULE_EXACT_ALARM` و`USE_FULL_SCREEN_INTENT` إلى
> Google Play تتطلّب مبرّرًا في نموذج الرفع. LifeFlow ينطبق عليه استثناء
> **"Alarm/Timer app"**.

## كيفية عمل نظام التنبيهات

- كل مهمة يُنشئها المستخدم تُسجَّل تلقائيًا في `AlarmManager` عبر
  `@capacitor/local-notifications` (ملف `src/lib/native-alarms.ts`).
- `allowWhileIdle: true` يضمن الرنين حتى في وضع Doze.
- قناة `lifeflow-alarms` بأهمية `HIGH` وظهور فوق شاشة القفل.
- عند إعادة تشغيل الهاتف، الـ Broadcast Receiver المدمج في Capacitor يعيد
  جدولة كل التنبيهات المعلّقة تلقائيًا.
- على الويب: يبقى النظام القديم (Timers + Web Notifications) يعمل بدون تغيير.

## ما تم تنفيذه في هذه المرحلة (Phase 1)

- ✅ تكامل Capacitor + Android platform
- ✅ AlarmManager دقيق + Boot rescheduling عبر Local Notifications plugin
- ✅ قناة إشعارات عالية الأولوية تظهر على شاشة القفل
- ✅ مزامنة تلقائية للمهام مع نظام التنبيهات
- ✅ زر «اختبار المنبه» + طلب أذونات في الإعدادات
- ✅ الويب يبقى يعمل كما هو (لا تغيير في تجربة المتصفح)

## المرحلة القادمة (Phase 2 — تحتاج طلبًا صريحًا)

هذه تتطلّب كتابة كود Kotlin أصلي داخل مجلد `android/` بعد توليده:

- Full-Screen Intent Activity بواجهة تنبيه فوق شاشة القفل مع تصاعد صوت وطرق
  إيقاف متقدّمة (مسألة رياضية، هز الهاتف…).
- مكتبة نغمات ضخمة (يجب إضافة ملفات `.wav`/`.ogg` تحت `android/app/src/main/res/raw/`).
- شاشة أذونات موجّهة تعرض إرشادات مخصّصة لكل شركة (Xiaomi/Samsung/Huawei…).
- سجل التنبيهات المخزّن محليًا.

اطلب "نفّذ Phase 2" عندما تريد المتابعة.