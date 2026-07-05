package app.lovable.lifeflow.alarms;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import java.util.Calendar;
import org.json.JSONArray;
import org.json.JSONObject;

final class AlarmScheduler {
    static final String EXTRA_PAYLOAD = "payload";
    private static final int LOOKAHEAD_DAYS = 14;

    private AlarmScheduler() {}

    static void replaceAll(Context context, JSONArray items) {
        cancelStored(context);
        AlarmStore.setItems(context, items);
        scheduleFromStore(context);
    }

    static void scheduleFromStore(Context context) {
        JSONArray ids = new JSONArray();
        JSONArray items = AlarmStore.getItems(context);
        long now = System.currentTimeMillis();
        for (int i = 0; i < items.length(); i++) {
            JSONObject item = items.optJSONObject(i);
            if (item == null || !item.optBoolean("enabled", true)) continue;
            String kind = item.optString("kind", "alarm");
            if ("wake".equals(kind)) {
                scheduleWakeOccurrences(context, item, now, ids);
            } else {
                long at = item.optLong("epochMillis", 0L);
                if (at > now) scheduleOne(context, item, at, ids);
            }
        }
        AlarmStore.setScheduledIds(context, ids);
    }

    static void scheduleSnooze(Context context, String payload, int minutes) {
        try {
            JSONObject item = new JSONObject(payload);
            item.put("id", item.optString("id", "alarm") + ":snooze:" + System.currentTimeMillis());
            item.put("body", item.optString("body", "") + " · Snooze");
            scheduleOne(context, item, System.currentTimeMillis() + Math.max(1, minutes) * 60_000L, null);
        } catch (Exception ignored) {}
    }

    static boolean canScheduleExact(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return false;
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.S || am.canScheduleExactAlarms();
    }

    static int storedItemCount(Context context) { return AlarmStore.getItems(context).length(); }
    static int pendingCount(Context context) { return AlarmStore.getScheduledIds(context).length(); }

    private static void scheduleWakeOccurrences(Context context, JSONObject item, long now, JSONArray ids) {
        String time = item.optString("time", "07:00");
        String[] hm = time.split(":");
        int hour = parseInt(hm.length > 0 ? hm[0] : "7", 7);
        int minute = parseInt(hm.length > 1 ? hm[1] : "0", 0);
        JSONArray days = item.optJSONArray("days");
        Calendar base = Calendar.getInstance();
        for (int offset = 0; offset <= LOOKAHEAD_DAYS; offset++) {
            Calendar c = (Calendar) base.clone();
            c.add(Calendar.DAY_OF_YEAR, offset);
            c.set(Calendar.HOUR_OF_DAY, hour);
            c.set(Calendar.MINUTE, minute);
            c.set(Calendar.SECOND, 0);
            c.set(Calendar.MILLISECOND, 0);
            if (c.getTimeInMillis() <= now) continue;
            int jsDay = c.get(Calendar.DAY_OF_WEEK) - 1;
            if (days != null && days.length() > 0 && !containsDay(days, jsDay)) continue;
            scheduleOne(context, item, c.getTimeInMillis(), ids);
            if (days == null || days.length() == 0) break;
        }
    }

    private static boolean containsDay(JSONArray days, int day) {
        for (int i = 0; i < days.length(); i++) if (days.optInt(i, -1) == day) return true;
        return false;
    }

    private static void scheduleOne(Context context, JSONObject item, long at, JSONArray ids) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        int requestCode = stableId(item.optString("id", "alarm") + ":" + at);
        Intent intent = new Intent(context, AlarmReceiver.class);
        intent.putExtra(EXTRA_PAYLOAD, item.toString());
        PendingIntent pi = PendingIntent.getBroadcast(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
        else am.setExact(AlarmManager.RTC_WAKEUP, at, pi);
        if (ids != null) ids.put(requestCode);
    }

    private static void cancelStored(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        JSONArray ids = AlarmStore.getScheduledIds(context);
        for (int i = 0; i < ids.length(); i++) {
            int id = ids.optInt(i);
            Intent intent = new Intent(context, AlarmReceiver.class);
            PendingIntent pi = PendingIntent.getBroadcast(context, id, intent, PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
            if (pi != null) am.cancel(pi);
        }
        AlarmStore.setScheduledIds(context, new JSONArray());
    }

    private static int stableId(String s) {
        int h = 17;
        for (int i = 0; i < s.length(); i++) h = 31 * h + s.charAt(i);
        return Math.abs(h == Integer.MIN_VALUE ? 1 : h);
    }

    private static int parseInt(String s, int fallback) {
        try { return Integer.parseInt(s); } catch (Exception e) { return fallback; }
    }
}