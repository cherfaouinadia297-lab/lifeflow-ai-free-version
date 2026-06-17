# خطة التنفيذ — ترجمة كاملة + وحدة الأخبار والأحداث + تصنيفات جديدة

## النطاق (كبير جدًا — سيتم تنفيذه دفعة واحدة)

سأقوم بإعادة هيكلة الترجمة لتغطية 100% من النصوص، مع إضافة وحدة أخبار/أحداث وتصنيفات مهام جديدة. أهم القرارات:

### 1) نظام الترجمة الموحّد (i18n v2)

- **تقليص اللغات المعروضة** إلى **3 فقط** كما طلبت: **English (افتراضي)**, **العربية**, **Français**. (ملاحظة: التطبيق حاليًا يدّعي 17 لغة لكن غالبيتها فارغة — سأحذفها لأن الواجهة المختلطة أسوأ من تركها).
- ملف `src/lib/i18n.ts` يُعاد بناؤه كقاموس مفاتيح مسطّحة: `home.title`, `tasks.addTask`, `prayer.nextPrayer` ... بثلاث لغات كاملة.
- Hook `useT()` يعطي: `t(key, vars?)`, `lang`, `dir`, `formatDate(date, opts?)`, `formatNumber(n, opts?)`, `formatTime(date)`, `relativeDays(date)` — يستخدم `Intl.DateTimeFormat`/`Intl.NumberFormat` مع locale المناسب (`en-US`, `ar-EG`, `fr-FR`) → أرقام عربية-هندية للعربية تلقائيًا، تواريخ مترجمة، علامة %.
- التبديل فوري بدون refresh (موجود بالفعل عبر store + إعادة تطبيق `dir`/`lang` على `<html>`).

### 2) تطبيق الترجمة على كل الصفحات والمكوّنات

استبدال كل نص مكتوب بالعربية مباشرة بمفاتيح:
- `__root.tsx` (AlarmDialog, taglines)
- `AppShell.tsx` (الشريط الجانبي + السفلي + رأس الصفحة)
- `TaskCard.tsx`, `TaskDialog.tsx`
- الصفحات: `index`, `tasks`, `schedule`, `stats`, `timer`, `assistant`, `prayer`, `weather`, `settings`, **`news`** (جديد)
- رسائل `toast`, التحقق من النماذج، الحالات الفارغة، حالات التحميل، الأخطاء
- التواريخ والأرقام في كل مكان تستخدم helpers الجديدة (لا `toLocaleDateString('ar-...')` ثابتة)

### 3) دعم RTL كامل

- موجود `dir="rtl"` على `<html>` للعربية.
- مراجعة الـ classes: تبديل `ml-/mr-` بـ `ms-/me-` (Tailwind v4 يدعمها)، `text-left/right` → `text-start/end`، `space-x` → `gap` حيث لزم. سأمر على كل ملف.
- الـ Sidebar من shadcn يتعامل مع RTL تلقائيًا عبر `dir`.

### 4) تصنيفات المهام الجديدة

تحديث `src/lib/categories.ts` لإضافة:
دراسة 📚، عمل 💼، صحة ورياضة 🏃، عبادة 🕌، عائلة 👨‍👩‍👧‍👦، أصدقاء 👥، مال 💰، تسوق 🛒، طعام 🍔، ترفيه 🎮، تعلّم 📖، تكنولوجيا 💻، مشاريع 🚀، سفر ✈️، يومية 📝.
كل تصنيف له مفتاح ترجمة `categories.<id>` بثلاث لغات + emoji + لون.

### 5) وحدة الأخبار والأحداث (`/news`)

**API**: سأستخدم **GNews API** (مجاني، يدعم لغات وبلدان، يعيد صورًا من مصادر موثوقة) — يحتاج مفتاحًا. سأطلب من المستخدم إضافته كـ secret عبر Lovable Cloud. للأحداث: **Nager.Date API** (مجاني بدون مفتاح، عطل رسمية لكل دولة) + Hijri events من جدول ثابت (المناسبات الإسلامية: رمضان، عيد الفطر، عيد الأضحى، المولد ... محسوبة عبر `Intl.DateTimeFormat('...-u-ca-islamic')`).

**الميزات**:
- تبويبان: «الأخبار» و«الأحداث القادمة»
- أخبار: بحث، فلترة بالفئة (تقنية/أعمال/رياضة/علوم/صحة/ترفيه/عام)، بلد المستخدم تلقائيًا، حفظ مفضّلة في localStorage، فتح المقال الكامل في تبويب جديد، صور من المصدر.
- أحداث: عطل وطنية (حسب بلد المستخدم) + مناسبات إسلامية + أيام دولية ثابتة + أحداث شخصية يضيفها المستخدم. عرض اسم/تاريخ/عدّاد أيام متبقية/وصف، إبراز ما يحدث خلال 7 أيام، عرض شهري.
- Dashboard (`/`): widget بأهم 3 عناوين + أقرب حدث قادم.
- تحديث تلقائي عند الفتح، cache 30 دقيقة في localStorage، رسائل أخطاء API ودودة.

**التصميم**: نفس نمط بقية التطبيق (`bg-card`, `rounded-2xl`, `shadow-soft`, `bg-gradient-primary`)، responsive، dark/light.

### 6) تنظيف وتحقق

- بحث `rg` عن أي نص عربي/إنجليزي ثابت متبقّي في `src/routes` و`src/components` وتحويله لمفاتيح.
- التأكد من البناء بدون أخطاء.

## الملفات

**جديد**: `src/lib/news.ts`, `src/lib/events.ts`, `src/routes/news.tsx`, `src/components/NewsWidget.tsx`
**معدّل**: `src/lib/i18n.ts` (إعادة كتابة), `src/lib/categories.ts`, `src/components/AppShell.tsx`, `src/components/TaskCard.tsx`, `src/components/TaskDialog.tsx`, `src/routes/__root.tsx`, `src/routes/index.tsx`, `src/routes/tasks.tsx`, `src/routes/schedule.tsx`, `src/routes/stats.tsx`, `src/routes/timer.tsx`, `src/routes/assistant.tsx`, `src/routes/prayer.tsx`, `src/routes/weather.tsx`, `src/routes/settings.tsx`, `src/routeTree.gen.ts` (تلقائي).

## ملاحظات صريحة

- **اللغات**: 3 فقط (EN/AR/FR) كما حدّدتَ. سأحذف اللغات الـ14 الفارغة الأخرى — هل توافق؟ إن أردتَ الإبقاء قل لي.
- **الصفحات في طلبك (Habits, Goals, Notes, Calendar, Notifications, Profile, Auth)** غير موجودة حاليًا في المشروع. لن أنشئها الآن لأن المهمة ضخمة بالفعل؛ سأركّز على الموجود + News/Events. أخبرني إن أردت إنشاء الباقي في جولة منفصلة.
- **مفتاح GNews API**: سأطلبه بعد موافقتك على الخطة (مجاني من gnews.io — 100 طلب/يوم).