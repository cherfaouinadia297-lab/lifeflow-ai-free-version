package app.lovable.lifeflow.alarms;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;

final class AlarmStore {
    private static final String PREF = "lifeflow_native_alarms";
    private static final String ITEMS = "items";
    private static final String IDS = "scheduled_ids";

    private AlarmStore() {}

    static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREF, Context.MODE_PRIVATE);
    }

    static JSONArray getItems(Context context) {
        try { return new JSONArray(prefs(context).getString(ITEMS, "[]")); }
        catch (Exception e) { return new JSONArray(); }
    }

    static void setItems(Context context, JSONArray items) {
        prefs(context).edit().putString(ITEMS, items.toString()).apply();
    }

    static JSONArray getScheduledIds(Context context) {
        try { return new JSONArray(prefs(context).getString(IDS, "[]")); }
        catch (Exception e) { return new JSONArray(); }
    }

    static void setScheduledIds(Context context, JSONArray ids) {
        prefs(context).edit().putString(IDS, ids.toString()).apply();
    }
}