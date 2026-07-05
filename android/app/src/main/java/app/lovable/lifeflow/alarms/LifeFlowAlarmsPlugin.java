package app.lovable.lifeflow.alarms;

import android.Manifest;
import android.app.AlarmManager;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import androidx.core.app.NotificationManagerCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;

@CapacitorPlugin(name = "LifeFlowAlarms")
public class LifeFlowAlarmsPlugin extends Plugin {
    @PluginMethod public void sync(PluginCall call) {
        try {
            JSArray arr = call.getArray("alarms", new JSArray());
            AlarmScheduler.replaceAll(getContext(), new JSONArray(arr.toString()));
            JSObject ret = new JSObject();
            ret.put("stored", AlarmScheduler.storedItemCount(getContext()));
            ret.put("pending", AlarmScheduler.pendingCount(getContext()));
            call.resolve(ret);
        } catch (Exception e) { call.reject("sync_failed", e); }
    }

    @PluginMethod public void diagnostics(PluginCall call) {
        Context c = getContext();
        JSObject ret = new JSObject();
        ret.put("sdk", Build.VERSION.SDK_INT);
        ret.put("manufacturer", Build.MANUFACTURER);
        ret.put("model", Build.MODEL);
        ret.put("notifications", NotificationManagerCompat.from(c).areNotificationsEnabled());
        ret.put("exactAlarm", AlarmScheduler.canScheduleExact(c));
        ret.put("batteryOptimized", !isIgnoringBattery(c));
        ret.put("storedAlarms", AlarmScheduler.storedItemCount(c));
        ret.put("pendingAlarms", AlarmScheduler.pendingCount(c));
        ret.put("bootReceiver", true);
        ret.put("foregroundService", true);
        ret.put("wakeLock", c.checkCallingOrSelfPermission(Manifest.permission.WAKE_LOCK) == PackageManager.PERMISSION_GRANTED);
        ret.put("fullScreenIntent", canUseFullScreenIntent(c));
        ret.put("channel", channelOk(c));
        ret.put("oemGuide", oemGuide());
        call.resolve(ret);
    }

    @PluginMethod public void openExactAlarmSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) startActivity(new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:" + getContext().getPackageName())));
        call.resolve();
    }

    @PluginMethod public void openBatterySettings(PluginCall call) {
        try { startActivity(new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:" + getContext().getPackageName()))); }
        catch (Exception e) { startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getContext().getPackageName()))); }
        call.resolve();
    }

    @PluginMethod public void openAppSettings(PluginCall call) {
        startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getContext().getPackageName())));
        call.resolve();
    }

    private void startActivity(Intent intent) {
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
    }

    private boolean isIgnoringBattery(Context c) {
        PowerManager pm = (PowerManager) c.getSystemService(Context.POWER_SERVICE);
        return pm != null && pm.isIgnoringBatteryOptimizations(c.getPackageName());
    }

    private boolean canUseFullScreenIntent(Context c) {
        if (Build.VERSION.SDK_INT < 34) return true;
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        return nm != null && nm.canUseFullScreenIntent();
    }

    private boolean channelOk(Context c) {
        AlarmForegroundService.ensureChannel(c);
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return true;
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        return nm != null && nm.getNotificationChannel(AlarmForegroundService.CHANNEL_ID) != null;
    }

    private String oemGuide() {
        String m = Build.MANUFACTURER.toLowerCase();
        if (m.contains("xiaomi") || m.contains("redmi") || m.contains("poco")) return "Xiaomi/MIUI: enable Autostart, set Battery saver to No restrictions, allow lock-screen notifications.";
        if (m.contains("samsung")) return "Samsung: set Battery to Unrestricted, disable Put unused apps to sleep, allow alarms and reminders.";
        if (m.contains("huawei") || m.contains("honor")) return "Huawei/Honor: enable App launch manually, allow Auto-launch/Secondary launch/Run in background.";
        if (m.contains("oppo") || m.contains("realme") || m.contains("oneplus") || m.contains("vivo")) return "Enable Auto Start and allow background activity in battery settings.";
        return "Keep notifications enabled, exact alarms allowed, and battery optimization disabled for LifeFlow AI.";
    }
}