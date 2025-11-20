import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';

const trendData = [
  { time: '00:00', value: 2.1, limit: 3.5 },
  { time: '04:00', value: 2.3, limit: 3.5 },
  { time: '08:00', value: 2.8, limit: 3.5 },
  { time: '12:00', value: 3.1, limit: 3.5 },
  { time: '16:00', value: 2.9, limit: 3.5 },
  { time: '20:00', value: 2.4, limit: 3.5 },
];

const equipment = [
  {
    id: 'NA-101',
    name: 'Насосный агрегат №1',
    motor: 'АИР 180M4',
    power: '30 кВт',
    status: 'ok',
    vibration: 2.1,
    limit: 3.5,
    trend: 'stable',
  },
  {
    id: 'NA-102',
    name: 'Насосный агрегат №2',
    motor: 'АИР 200L6',
    power: '45 кВт',
    status: 'warning',
    vibration: 3.8,
    limit: 3.5,
    trend: 'rising',
  },
  {
    id: 'NA-103',
    name: 'Насосный агрегат №3',
    motor: 'АИР 160S4',
    power: '15 кВт',
    status: 'ok',
    vibration: 1.9,
    limit: 3.5,
    trend: 'falling',
  },
  {
    id: 'NA-104',
    name: 'Насосный агрегат №4',
    motor: 'АИР 180M4',
    power: '30 кВт',
    status: 'critical',
    vibration: 4.5,
    limit: 3.5,
    trend: 'rising',
  },
];

const statusConfig = {
  ok: { label: 'НОРМА', color: 'bg-green-500/20 text-green-400 border-green-500/50', icon: 'CheckCircle' },
  warning: { label: 'ВНИМАНИЕ', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50', icon: 'AlertTriangle' },
  critical: { label: 'КРИТИЧНО', color: 'bg-red-500/20 text-red-400 border-red-500/50', icon: 'AlertCircle' },
};

const trendConfig = {
  stable: { icon: 'Minus', color: 'text-slate-500' },
  rising: { icon: 'TrendingUp', color: 'text-red-400' },
  falling: { icon: 'TrendingDown', color: 'text-green-400' },
};

export default function Index() {
  const [selectedEquipment, setSelectedEquipment] = useState(equipment[0]);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b-2 border-green-500/30">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/10 border-2 border-green-500/50 flex items-center justify-center">
                <Icon name="Activity" size={24} className="text-green-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-wider text-foreground">ВИБРОКОНТРОЛЬ v2.1</h1>
                <p className="text-xs text-muted-foreground font-mono">SYS://VIBRO-DIAGNOSTIC-MONITOR</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right font-mono">
                <p className="text-xs text-muted-foreground">UPTIME</p>
                <p className="text-sm font-bold text-green-400">{new Date().toLocaleTimeString('ru-RU')}</p>
              </div>
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Card className="p-6 bg-card border-2 border-green-500/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground font-mono tracking-wider">TOTAL UNITS</span>
              <Icon name="Package" size={18} className="text-green-400" />
            </div>
            <p className="text-4xl font-bold text-green-400 font-mono">{equipment.length.toString().padStart(2, '0')}</p>
          </Card>

          <Card className="p-6 bg-card border-2 border-green-500/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground font-mono tracking-wider">OPERATIONAL</span>
              <Icon name="CheckCircle" size={18} className="text-green-400" />
            </div>
            <p className="text-4xl font-bold text-green-400 font-mono">
              {equipment.filter((e) => e.status === 'ok').length.toString().padStart(2, '0')}
            </p>
          </Card>

          <Card className="p-6 bg-card border-2 border-yellow-500/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground font-mono tracking-wider">ALERTS</span>
              <Icon name="AlertTriangle" size={18} className="text-yellow-400" />
            </div>
            <p className="text-4xl font-bold text-yellow-400 font-mono">
              {equipment.filter((e) => e.status === 'warning' || e.status === 'critical').length.toString().padStart(2, '0')}
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 bg-card border-2 border-green-500/30">
            <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2 tracking-wider font-mono">
              <Icon name="List" size={18} className="text-green-400" />
              [EQUIPMENT_REGISTRY]
            </h2>

            <div className="space-y-2">
              {equipment.map((item) => {
                const statusInfo = statusConfig[item.status];
                const trendInfo = trendConfig[item.trend];

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedEquipment(item)}
                    className={`w-full p-4 border-2 transition-all text-left font-mono ${
                      selectedEquipment.id === item.id
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-muted bg-card/50 hover:border-green-500/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-foreground text-sm">[{item.id}]</span>
                          <Badge
                            variant="outline"
                            className={`${statusInfo.color} border text-xs font-mono`}
                          >
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.motor} / {item.power}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-baseline gap-1 justify-end">
                          <span className="text-2xl font-bold text-green-400">{item.vibration}</span>
                          <span className="text-xs text-muted-foreground">mm/s</span>
                        </div>
                        <div className="flex items-center gap-1 justify-end mt-1">
                          <Icon name={trendInfo.icon} size={14} className={trendInfo.color} />
                          <span className="text-xs text-muted-foreground">MAX:{item.limit}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="p-6 bg-card border-2 border-green-500/30">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2 mb-1 tracking-wider font-mono">
                <Icon name="TrendingUp" size={18} className="text-green-400" />
                [ANALYSIS_MODULE]
              </h2>
              <p className="text-xs text-muted-foreground font-mono">{selectedEquipment.id} / {selectedEquipment.name}</p>
            </div>

            <Tabs defaultValue="trend" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/50 border border-green-500/30">
                <TabsTrigger value="trend" className="font-mono text-xs data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">TREND</TabsTrigger>
                <TabsTrigger value="info" className="font-mono text-xs data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">INFO</TabsTrigger>
              </TabsList>

              <TabsContent value="trend" className="space-y-4">
                <div className="h-[280px] p-4 bg-muted/20 border border-green-500/20">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="time"
                        stroke="#9ca3af"
                        style={{ fontSize: '11px', fontFamily: 'monospace' }}
                      />
                      <YAxis
                        stroke="#9ca3af"
                        style={{ fontSize: '11px', fontFamily: 'monospace' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #22c55e',
                          color: '#fff',
                          fontFamily: 'monospace',
                          fontSize: '12px',
                        }}
                      />
                      <ReferenceLine
                        y={selectedEquipment.limit}
                        stroke="#ef4444"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        label={{ value: 'LIMIT', fill: '#ef4444', fontSize: 11, fontFamily: 'monospace' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#22c55e"
                        strokeWidth={2}
                        fill="url(#colorValue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/20 border-l-4 border-green-500">
                    <p className="text-xs text-muted-foreground mb-1 font-mono">CURRENT</p>
                    <p className="text-2xl font-bold text-green-400 font-mono">
                      {selectedEquipment.vibration}
                    </p>
                  </div>
                  <div className="p-4 bg-muted/20 border-l-4 border-red-500">
                    <p className="text-xs text-muted-foreground mb-1 font-mono">LIMIT</p>
                    <p className="text-2xl font-bold text-red-400 font-mono">
                      {selectedEquipment.limit}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="info" className="space-y-3">
                <div className="space-y-2">
                  <div className="p-3 border-l-4 border-green-500 bg-muted/20">
                    <p className="text-xs text-muted-foreground mb-1 font-mono">MOTOR</p>
                    <p className="text-sm font-bold text-foreground font-mono">{selectedEquipment.motor}</p>
                  </div>
                  <div className="p-3 border-l-4 border-green-500 bg-muted/20">
                    <p className="text-xs text-muted-foreground mb-1 font-mono">POWER</p>
                    <p className="text-sm font-bold text-foreground font-mono">{selectedEquipment.power}</p>
                  </div>
                  <div className="p-3 border-l-4 border-green-500 bg-muted/20">
                    <p className="text-xs text-muted-foreground mb-1 font-mono">STATUS</p>
                    <Badge className={`${statusConfig[selectedEquipment.status].color} border text-xs font-mono`}>
                      {statusConfig[selectedEquipment.status].label}
                    </Badge>
                  </div>
                  <div className="p-3 border-l-4 border-green-500 bg-muted/20">
                    <p className="text-xs text-muted-foreground mb-1 font-mono">TREND</p>
                    <div className="flex items-center gap-2">
                      <Icon
                        name={trendConfig[selectedEquipment.trend].icon}
                        size={18}
                        className={trendConfig[selectedEquipment.trend].color}
                      />
                      <span className="text-sm font-bold text-foreground font-mono uppercase">
                        {selectedEquipment.trend}
                      </span>
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 border-2 border-green-500/50 font-mono text-xs tracking-wider">
                  <Icon name="FileText" size={16} className="mr-2" />
                  [GENERATE_REPORT]
                </Button>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </main>
    </div>
  );
}
