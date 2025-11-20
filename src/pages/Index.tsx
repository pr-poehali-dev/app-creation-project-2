import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import * as XLSX from 'xlsx';
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
import { analyzeVibrationGOST, getTrendAnalysis, type VibrationZone } from '@/lib/gostAnalysis';

interface EquipmentData {
  id: string;
  name: string;
  motor: string;
  power: number;
  vibrationData: { time: string; value: number }[];
  gostAnalysis?: VibrationZone;
  trendAnalysis?: {
    trend: 'stable' | 'rising' | 'falling';
    changePercent: number;
    description: string;
  };
}



export default function Index() {
  const [equipment, setEquipment] = useState<EquipmentData[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processEquipmentData = (equipmentList: EquipmentData[]) => {
    return equipmentList.map((item) => {
      const values = item.vibrationData.map((d) => d.value);
      const currentVibration = values[values.length - 1] || 0;
      
      const gostAnalysis = analyzeVibrationGOST(currentVibration, item.power);
      const trendAnalysis = getTrendAnalysis(values);

      return {
        ...item,
        gostAnalysis,
        trendAnalysis,
      };
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        console.log('Прочитано строк:', jsonData.length);
        console.log('Первая строка:', jsonData[0]);

        const parsedEquipment: EquipmentData[] = [];
        const equipmentMap = new Map<string, any>();

        jsonData.forEach((row: any) => {
          const id = row['ID'] || row['id'] || row['Агрегат'] || row['№'] || `EQ-${Math.random().toString(36).substr(2, 9)}`;
          const name = row['Название'] || row['name'] || row['Наименование'] || row['Агрегат'] || id;
          const motor = row['Двигатель'] || row['motor'] || row['Мотор'] || row['Двигатель'] || 'N/A';
          const powerStr = row['Мощность'] || row['power'] || row['кВт'] || row['Мощность, кВт'] || '0';
          const power = parseFloat(String(powerStr).replace(/[^\d.]/g, '')) || 0;
          const time = row['Время'] || row['time'] || row['Timestamp'] || row['Дата'] || new Date().toLocaleTimeString();
          const valueStr = row['Вибрация'] || row['vibration'] || row['value'] || row['Значение'] || '0';
          const value = parseFloat(String(valueStr).replace(/[^\d.]/g, '')) || 0;

          if (!equipmentMap.has(id)) {
            equipmentMap.set(id, {
              id,
              name,
              motor,
              power,
              vibrationData: [],
            });
          }

          equipmentMap.get(id).vibrationData.push({ time: time.toString(), value });
        });

        equipmentMap.forEach((eq) => {
          parsedEquipment.push(eq);
        });

        console.log('Распознано агрегатов:', parsedEquipment.length);
        console.log('Данные:', parsedEquipment);

        if (parsedEquipment.length > 0) {
          const processedData = processEquipmentData(parsedEquipment);
          console.log('Обработано агрегатов:', processedData.length);
          setEquipment(processedData);
          setSelectedEquipment(processedData[0]);
        } else {
          alert('Не удалось распознать данные. Проверьте структуру файла.');
        }
      } catch (error) {
        console.error('Ошибка парсинга файла:', error);
        alert(`Ошибка чтения файла: ${error}\nПроверьте формат данных.`);
      } finally {
        setIsLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const processedEquipment = equipment;

  const currentEquipment = selectedEquipment && processedEquipment.find((e) => e.id === selectedEquipment.id);
  const currentVibration = currentEquipment ? currentEquipment.vibrationData[currentEquipment.vibrationData.length - 1]?.value || 0 : 0;
  const gostAnalysis = currentEquipment?.gostAnalysis;
  const trendAnalysis = currentEquipment?.trendAnalysis;

  const statusConfig = {
    green: { color: 'bg-green-500/20 text-green-400 border-green-500/50', icon: 'CheckCircle' },
    yellow: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50', icon: 'AlertTriangle' },
    orange: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/50', icon: 'AlertTriangle' },
    red: { color: 'bg-red-500/20 text-red-400 border-red-500/50', icon: 'AlertCircle' },
  };

  const trendConfig = {
    stable: { icon: 'Minus', color: 'text-slate-500' },
    rising: { icon: 'TrendingUp', color: 'text-red-400' },
    falling: { icon: 'TrendingDown', color: 'text-green-400' },
  };

  const normalCount = processedEquipment.filter((e) => e.gostAnalysis?.zone === 'A').length;
  const warningCount = processedEquipment.filter((e) => ['B', 'C', 'D'].includes(e.gostAnalysis?.zone || '')).length;

  return (
    <div className="min-h-screen bg-background">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xls,.xlsx"
        onChange={handleFileUpload}
        className="hidden"
      />

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
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border-2 border-green-500/50 font-mono text-xs tracking-wider"
              >
                <Icon name="Upload" size={16} className="mr-2" />
                {isLoading ? 'LOADING...' : '[LOAD_XLS]'}
              </Button>
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
            <p className="text-4xl font-bold text-green-400 font-mono">
              {processedEquipment.length.toString().padStart(2, '0')}
            </p>
          </Card>

          <Card className="p-6 bg-card border-2 border-green-500/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground font-mono tracking-wider">ZONE A</span>
              <Icon name="CheckCircle" size={18} className="text-green-400" />
            </div>
            <p className="text-4xl font-bold text-green-400 font-mono">
              {normalCount.toString().padStart(2, '0')}
            </p>
          </Card>

          <Card className="p-6 bg-card border-2 border-yellow-500/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground font-mono tracking-wider">ALERTS</span>
              <Icon name="AlertTriangle" size={18} className="text-yellow-400" />
            </div>
            <p className="text-4xl font-bold text-yellow-400 font-mono">
              {warningCount.toString().padStart(2, '0')}
            </p>
          </Card>
        </div>

        {equipment.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-green-500/10 border-2 border-green-500/50 flex items-center justify-center mb-4">
              <Icon name="Upload" size={40} className="text-green-400" />
            </div>
            <p className="text-foreground font-mono text-lg mb-2">[NO_DATA_LOADED]</p>
            <p className="text-muted-foreground font-mono text-sm mb-4">Загрузите XLS файл для начала анализа</p>
            <div className="text-center">
              <p className="text-xs text-muted-foreground font-mono mb-2">Формат XLS файла:</p>
              <div className="bg-muted/20 p-3 rounded border border-green-500/20 font-mono text-xs text-left">
                <p className="text-green-400">ID, Название, Двигатель, Мощность, Время, Вибрация</p>
              </div>
              <a 
                href="/demo-vibration-data.txt" 
                download="demo-vibration-data.csv"
                className="inline-block mt-4 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50 font-mono text-xs"
              >
                <Icon name="Download" size={14} className="inline mr-2" />
                Скачать пример CSV
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 bg-card border-2 border-green-500/30">
              <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2 tracking-wider font-mono">
                <Icon name="List" size={18} className="text-green-400" />
                [EQUIPMENT_REGISTRY]
              </h2>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {processedEquipment.map((item) => {
                const analysis = item.gostAnalysis!;
                const trend = item.trendAnalysis!;
                const statusInfo = statusConfig[analysis.color as keyof typeof statusConfig];
                const trendInfo = trendConfig[trend.trend];
                const currentValue = item.vibrationData[item.vibrationData.length - 1]?.value || 0;

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedEquipment(item)}
                    className={`w-full p-4 border-2 transition-all text-left font-mono ${
                      selectedEquipment?.id === item.id
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-muted bg-card/50 hover:border-green-500/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-foreground text-sm">[{item.id}]</span>
                          <Badge variant="outline" className={`${statusInfo.color} border text-xs font-mono`}>
                            {analysis.zone}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.motor} / {item.power} кВт
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-baseline gap-1 justify-end">
                          <span className={`text-2xl font-bold text-${analysis.color}-400`}>
                            {currentValue.toFixed(1)}
                          </span>
                          <span className="text-xs text-muted-foreground">mm/s</span>
                        </div>
                        <div className="flex items-center gap-1 justify-end mt-1">
                          <Icon name={trendInfo.icon} size={14} className={trendInfo.color} />
                          <span className="text-xs text-muted-foreground">{trend.changePercent.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {currentEquipment && (
            <Card className="p-6 bg-card border-2 border-green-500/30">
              <div className="mb-4">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2 mb-1 tracking-wider font-mono">
                  <Icon name="TrendingUp" size={18} className="text-green-400" />
                  [ANALYSIS_MODULE]
                </h2>
                <p className="text-xs text-muted-foreground font-mono">
                  {currentEquipment.id} / {currentEquipment.name}
                </p>
              </div>

              <Tabs defaultValue="trend" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4 bg-muted/50 border border-green-500/30">
                  <TabsTrigger
                    value="trend"
                    className="font-mono text-xs data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400"
                  >
                    TREND
                  </TabsTrigger>
                  <TabsTrigger
                    value="gost"
                    className="font-mono text-xs data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400"
                  >
                    GOST
                  </TabsTrigger>
                  <TabsTrigger
                    value="info"
                    className="font-mono text-xs data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400"
                  >
                    INFO
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="trend" className="space-y-4">
                  <div className="h-[280px] p-4 bg-muted/20 border border-green-500/20">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={currentEquipment.vibrationData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="time" stroke="#9ca3af" style={{ fontSize: '11px', fontFamily: 'monospace' }} />
                      <YAxis stroke="#9ca3af" style={{ fontSize: '11px', fontFamily: 'monospace' }} />
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
                        y={2.8}
                        stroke="#ef4444"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        label={{ value: 'ZONE B', fill: '#ef4444', fontSize: 11, fontFamily: 'monospace' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} fill="url(#colorValue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="p-4 bg-muted/20 border-l-4 border-green-500">
                  <p className="text-xs text-muted-foreground mb-1 font-mono">TREND ANALYSIS</p>
                  <p className="text-sm text-foreground font-mono">{trendAnalysis?.description}</p>
                </div>
              </TabsContent>

              <TabsContent value="gost" className="space-y-4">
                {gostAnalysis && (
                  <>
                    <div className={`p-4 border-l-4 border-${gostAnalysis.color}-500 bg-${gostAnalysis.color}-500/10`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon
                          name={statusConfig[gostAnalysis.color as keyof typeof statusConfig].icon}
                          size={20}
                          className={`text-${gostAnalysis.color}-400`}
                        />
                        <p className="text-sm font-bold text-foreground font-mono">{gostAnalysis.label}</p>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono mb-2">{gostAnalysis.description}</p>
                    </div>

                    <div className="p-4 bg-muted/20 border border-green-500/20">
                      <p className="text-xs text-muted-foreground mb-2 font-mono">РЕКОМЕНДАЦИИ:</p>
                      <p className="text-sm text-foreground font-mono leading-relaxed">{gostAnalysis.recommendation}</p>
                    </div>

                    <div className="p-4 bg-muted/20 border border-green-500/20">
                      <p className="text-xs text-muted-foreground mb-2 font-mono">СТАНДАРТ:</p>
                      <p className="text-xs text-foreground font-mono">ГОСТ Р ИСО 20816-1-2021</p>
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        Мощность: {currentEquipment.power} кВт
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        Текущее значение: {currentVibration.toFixed(2)} мм/с
                      </p>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="info" className="space-y-3">
                <div className="space-y-2">
                  <div className="p-3 border-l-4 border-green-500 bg-muted/20">
                    <p className="text-xs text-muted-foreground mb-1 font-mono">MOTOR</p>
                    <p className="text-sm font-bold text-foreground font-mono">{currentEquipment.motor}</p>
                  </div>
                  <div className="p-3 border-l-4 border-green-500 bg-muted/20">
                    <p className="text-xs text-muted-foreground mb-1 font-mono">POWER</p>
                    <p className="text-sm font-bold text-foreground font-mono">{currentEquipment.power} кВт</p>
                  </div>
                  <div className="p-3 border-l-4 border-green-500 bg-muted/20">
                    <p className="text-xs text-muted-foreground mb-1 font-mono">DATA POINTS</p>
                    <p className="text-sm font-bold text-foreground font-mono">
                      {currentEquipment.vibrationData.length}
                    </p>
                  </div>
                </div>

                <Button className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 border-2 border-green-500/50 font-mono text-xs tracking-wider">
                  <Icon name="FileText" size={16} className="mr-2" />
                  [GENERATE_REPORT]
                </Button>
              </TabsContent>
            </Tabs>
          </Card>
          )}
          </div>
        )}
      </main>
    </div>
  );
}