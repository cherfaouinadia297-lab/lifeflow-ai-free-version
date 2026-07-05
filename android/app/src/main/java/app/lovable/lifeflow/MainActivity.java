package app.lovable.lifeflow;

import com.getcapacitor.BridgeActivity;
import app.lovable.lifeflow.alarms.LifeFlowAlarmsPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(LifeFlowAlarmsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
