package app.lovable.lifeflow.alarms;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.PowerManager;

public class AlarmReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        PowerManager.WakeLock wl = null;
        try {
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                wl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "LifeFlow:AlarmReceiver");
                wl.acquire(60_000L);
            }
            String payload = intent.getStringExtra(AlarmScheduler.EXTRA_PAYLOAD);
            Intent service = new Intent(context, AlarmForegroundService.class);
            service.putExtra(AlarmScheduler.EXTRA_PAYLOAD, payload);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) context.startForegroundService(service);
            else context.startService(service);
            AlarmScheduler.scheduleFromStore(context);
        } finally {
            if (wl != null && wl.isHeld()) wl.release();
        }
    }
}