import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import {
  LineChart,
  Line,
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
  ok: { label: 'Норма', color: 'bg-emerald-500', icon: 'CheckCircle' },
  warning: { label: 'Внимание', color: 'bg-amber-500', icon: 'AlertTriangle' },
  critical: { label: 'Критично', color: 'bg-red-500', icon: 'AlertCircle' },
};

const trendConfig = {
  stable: { icon: 'Minus', color: 'text-slate-400' },
  rising: { icon: 'TrendingUp', color: 'text-red-500' },
  falling: { icon: 'TrendingDown', color: 'text-emerald-500' },
};

export default function Index() {
  const [selectedEquipment, setSelectedEquipment] = useState(equipment[0]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white border-b border-slate-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="Activity" size={28} className="text-blue-400" />
              <div>
                <h1 className="text-xl font-semibold">ВиброКонтроль</h1>
                <p className="text-xs text-slate-400">Система мониторинга вибродиагностики</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-slate-400">Последнее обновление</p>
                <p className="text-sm font-medium">{new Date().toLocaleTimeString('ru-RU')}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="p-6 bg-white border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600 font-medium">Всего агрегатов</span>
              <Icon name="Package" size={20} className="text-slate-400" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{equipment.length}</p>
          </Card>

          <Card className="p-6 bg-white border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600 font-medium">В норме</span>
              <Icon name="CheckCircle" size={20} className="text-emerald-500" />
            </div>
            <p className="text-3xl font-bold text-emerald-600">
              {equipment.filter((e) => e.status === 'ok').length}
            </p>
          </Card>

          <Card className="p-6 bg-white border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600 font-medium">Требуют внимания</span>
              <Icon name="AlertTriangle" size={20} className="text-amber-500" />
            </div>
            <p className="text-3xl font-bold text-amber-600">
              {equipment.filter((e) => e.status === 'warning' || e.status === 'critical').length}
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 bg-white border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Icon name="List" size={20} />
              Оборудование
            </h2>

            <div className="space-y-3">
              {equipment.map((item) => {
                const statusInfo = statusConfig[item.status];
                const trendInfo = trendConfig[item.trend];

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedEquipment(item)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left hover:shadow-md ${
                      selectedEquipment.id === item.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-900">{item.id}</span>
                          <Badge
                            variant="outline"
                            className={`${statusInfo.color} text-white border-0`}
                          >
                            <Icon name={statusInfo.icon} size={12} className="mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">{item.name}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {item.motor} • {item.power}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <span className="text-2xl font-bold text-slate-900">{item.vibration}</span>
                          <span className="text-sm text-slate-500">мм/с</span>
                        </div>
                        <div className="flex items-center gap-1 justify-end mt-1">
                          <Icon name={trendInfo.icon} size={16} className={trendInfo.color} />
                          <span className="text-xs text-slate-500">макс {item.limit}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="p-6 bg-white border-slate-200">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-2">
                <Icon name="TrendingUp" size={20} />
                Анализ: {selectedEquipment.id}
              </h2>
              <p className="text-sm text-slate-600">{selectedEquipment.name}</p>
            </div>

            <Tabs defaultValue="trend" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="trend">Тренд вибрации</TabsTrigger>
                <TabsTrigger value="info">Информация</TabsTrigger>
              </TabsList>

              <TabsContent value="trend" className="space-y-4">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="time"
                        stroke="#64748b"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis
                        stroke="#64748b"
                        style={{ fontSize: '12px' }}
                        label={{ value: 'мм/с', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff',
                        }}
                      />
                      <ReferenceLine
                        y={selectedEquipment.limit}
                        stroke="#ef4444"
                        strokeDasharray="5 5"
                        label={{ value: 'Предел', fill: '#ef4444', fontSize: 12 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#0EA5E9"
                        strokeWidth={3}
                        fill="url(#colorValue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600 mb-1">Текущее значение</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {selectedEquipment.vibration} <span className="text-sm text-slate-500">мм/с</span>
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600 mb-1">Допустимый предел</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {selectedEquipment.limit} <span className="text-sm text-slate-500">мм/с</span>
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="info" className="space-y-4">
                <div className="space-y-3">
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Электродвигатель</p>
                    <p className="text-base font-semibold text-slate-900">{selectedEquipment.motor}</p>
                  </div>
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Мощность</p>
                    <p className="text-base font-semibold text-slate-900">{selectedEquipment.power}</p>
                  </div>
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Статус</p>
                    <Badge className={`${statusConfig[selectedEquipment.status].color} text-white border-0`}>
                      <Icon name={statusConfig[selectedEquipment.status].icon} size={14} className="mr-1" />
                      {statusConfig[selectedEquipment.status].label}
                    </Badge>
                  </div>
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Тренд изменения</p>
                    <div className="flex items-center gap-2">
                      <Icon
                        name={trendConfig[selectedEquipment.trend].icon}
                        size={20}
                        className={trendConfig[selectedEquipment.trend].color}
                      />
                      <span className="text-base font-semibold text-slate-900 capitalize">
                        {selectedEquipment.trend === 'stable' && 'Стабильный'}
                        {selectedEquipment.trend === 'rising' && 'Растущий'}
                        {selectedEquipment.trend === 'falling' && 'Снижающийся'}
                      </span>
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <Icon name="FileText" size={16} className="mr-2" />
                  Сформировать отчёт
                </Button>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </main>
    </div>
  );
}
