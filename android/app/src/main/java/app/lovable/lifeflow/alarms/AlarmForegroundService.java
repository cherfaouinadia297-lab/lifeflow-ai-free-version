package app.lovable.lifeflow.alarms;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import androidx.core.app.NotificationCompat;
import app.lovable.lifeflow.MainActivity;
import app.lovable.lifeflow.R;
import org.json.JSONObject;

public class AlarmForegroundService extends Service {
    static final String CHANNEL_ID = "lifeflow-critical-alarms";
    static final String ACTION_STOP = "app.lovable.lifeflow.alarms.STOP";
    private static final int NOTIFICATION_ID = 730001;
    private MediaPlayer player;

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopSelf();
            return START_NOT_STICKY;
        }
        String payload = intent == null ? null : intent.getStringExtra(AlarmScheduler.EXTRA_PAYLOAD);
        JSONObject item = parse(payload);
        ensureChannel(this);
        startForeground(NOTIFICATION_ID, buildNotification(item, payload));
        startSound();
        return START_STICKY;
    }

    @Override public void onDestroy() {
        stopSound();
        super.onDestroy();
    }

    @Override public IBinder onBind(Intent intent) { return null; }

    static void ensureChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null || nm.getNotificationChannel(CHANNEL_ID) != null) return;
        NotificationChannel ch = new NotificationChannel(CHANNEL_ID, "LifeFlow Critical Alarms", NotificationManager.IMPORTANCE_HIGH);
        ch.setDescription("Wake-up, prayer, and task alarms");
        ch.enableVibration(true);
        ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        ch.setBypassDnd(true);
        nm.createNotificationChannel(ch);
    }

    private Notification buildNotification(JSONObject item, String payload) {
        String title = item.optString("title", "LifeFlow Alarm");
        String body = item.optString("body", "Alarm is ringing");
        Intent ring = new Intent(this, AlarmRingActivity.class);
        ring.putExtra(AlarmScheduler.EXTRA_PAYLOAD, payload);
        ring.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent fullScreen = PendingIntent.getActivity(this, 7001, ring, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Intent open = new Intent(this, MainActivity.class);
        PendingIntent content = PendingIntent.getActivity(this, 7002, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Intent stop = new Intent(this, AlarmForegroundService.class).setAction(ACTION_STOP);
        PendingIntent stopPi = PendingIntent.getService(this, 7003, stop, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setOngoing(true)
                .setAutoCancel(false)
                .setContentIntent(content)
                .setFullScreenIntent(fullScreen, true)
                .addAction(0, "Stop", stopPi)
                .build();
    }

    private void startSound() {
        stopSound();
        try {
            Uri uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (uri == null) uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            player = MediaPlayer.create(this, uri);
            if (player == null) return;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                player.setAudioAttributes(new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build());
            }
            player.setLooping(true);
            player.start();
        } catch (Exception ignored) {}
    }

    private void stopSound() {
        try { if (player != null) { player.stop(); player.release(); } } catch (Exception ignored) {}
        player = null;
    }

    private JSONObject parse(String payload) {
        try { return payload == null ? new JSONObject() : new JSONObject(payload); }
        catch (Exception e) { return new JSONObject(); }
    }
}