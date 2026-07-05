package app.lovable.lifeflow.alarms;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import java.text.DateFormat;
import java.util.Date;
import org.json.JSONObject;

public class AlarmRingActivity extends Activity {
    private String payload;

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Window w = getWindow();
        w.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON | WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        }
        payload = getIntent().getStringExtra(AlarmScheduler.EXTRA_PAYLOAD);
        JSONObject item = parse(payload);
        buildUi(item);
    }

    private void buildUi(JSONObject item) {
        String kind = item.optString("kind", "wake");
        boolean prayer = "prayer".equals(kind);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        root.setPadding(48, 48, 48, 48);
        root.setBackgroundColor(prayer ? Color.rgb(6, 45, 45) : Color.rgb(15, 23, 42));

        TextView icon = text(prayer ? "🕌" : "⏰", 64, true);
        TextView title = text(item.optString("title", prayer ? "Prayer time" : "Wake up"), 28, true);
        TextView body = text(item.optString("body", ""), 16, false);
        TextView clock = text(DateFormat.getDateTimeInstance(DateFormat.FULL, DateFormat.SHORT).format(new Date()), 14, false);

        Button stop = button(prayer ? "إيقاف الأذان" : "Stop alarm");
        stop.setOnClickListener(v -> stopAndFinish());
        Button snooze = button("Snooze 9 min");
        snooze.setVisibility(prayer ? View.GONE : View.VISIBLE);
        snooze.setOnClickListener(v -> { AlarmScheduler.scheduleSnooze(this, payload, item.optInt("snoozeMinutes", 9)); stopAndFinish(); });

        root.addView(icon);
        root.addView(title);
        root.addView(body);
        root.addView(clock);
        root.addView(stop);
        root.addView(snooze);
        setContentView(root);
    }

    private TextView text(String s, int sp, boolean bold) {
        TextView v = new TextView(this);
        v.setText(s);
        v.setTextColor(Color.WHITE);
        v.setTextSize(sp);
        v.setGravity(Gravity.CENTER);
        v.setPadding(8, 10, 8, 10);
        if (bold) v.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        return v;
    }

    private Button button(String s) {
        Button b = new Button(this);
        b.setText(s);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        lp.setMargins(0, 18, 0, 0);
        b.setLayoutParams(lp);
        return b;
    }

    private void stopAndFinish() {
        startService(new Intent(this, AlarmForegroundService.class).setAction(AlarmForegroundService.ACTION_STOP));
        finishAndRemoveTask();
    }

    private JSONObject parse(String payload) {
        try { return payload == null ? new JSONObject() : new JSONObject(payload); }
        catch (Exception e) { return new JSONObject(); }
    }
}