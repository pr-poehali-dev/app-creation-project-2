import { useState, useRef, useEffect } from 'react';
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSummaryReport, setShowSummaryReport] = useState(false);
  const [newEquipment, setNewEquipment] = useState({ id: '', name: '', motor: '', power: '' });
  const [newMeasurement, setNewMeasurement] = useState({ time: '', value: '' });
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

  const handleAddEquipment = () => {
    if (!newEquipment.id || !newEquipment.name || !newEquipment.motor || !newEquipment.power) {
      alert('Заполните все поля агрегата');
      return;
    }
    if (!newMeasurement.time || !newMeasurement.value) {
      alert('Заполните дату и значение вибрации');
      return;
    }

    const existingEquipment = equipment.find(e => e.id === newEquipment.id);
    let updatedEquipment: EquipmentData[];

    if (existingEquipment) {
      updatedEquipment = equipment.map(e => {
        if (e.id === newEquipment.id) {
          return {
            ...e,
            vibrationData: [...e.vibrationData, { time: newMeasurement.time, value: parseFloat(newMeasurement.value) }]
          };
        }
        return e;
      });
    } else {
      const newEq: EquipmentData = {
        id: newEquipment.id,
        name: newEquipment.name,
        motor: newEquipment.motor,
        power: parseFloat(newEquipment.power),
        vibrationData: [{ time: newMeasurement.time, value: parseFloat(newMeasurement.value) }]
      };
      updatedEquipment = [...equipment, newEq];
    }

    const processed = processEquipmentData(updatedEquipment);
    setEquipment(processed);
    setNewMeasurement({ time: '', value: '' });
    if (!existingEquipment) {
      setNewEquipment({ id: '', name: '', motor: '', power: '' });
    }
    alert('Данные добавлены!');
  };

  const loadDemoData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/demo-vibration-data.csv');
      const text = await response.text();
      const workbook = XLSX.read(text, { type: 'string' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      const parsedEquipment: EquipmentData[] = [];
      const equipmentMap = new Map<string, any>();

      jsonData.forEach((row: any) => {
        const id = row['ID'] || row['id'];
        const name = row['Название'] || row['name'];
        const motor = row['Двигатель'] || row['motor'];
        const power = parseFloat(String(row['Мощность'] || row['power']).replace(/[^\d.]/g, '')) || 0;
        const time = row['Время'] || row['time'];
        const value = parseFloat(String(row['Вибрация'] || row['vibration']).replace(/[^\d.]/g, '')) || 0;

        if (!equipmentMap.has(id)) {
          equipmentMap.set(id, { id, name, motor, power, vibrationData: [] });
        }
        equipmentMap.get(id).vibrationData.push({ time: time.toString(), value });
      });

      equipmentMap.forEach((eq) => parsedEquipment.push(eq));

      if (parsedEquipment.length > 0) {
        const processedData = processEquipmentData(parsedEquipment);
        setEquipment(processedData);
        setSelectedEquipment(processedData[0]);
      }
    } catch (error) {
      console.error('Ошибка загрузки демо-данных:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDemoData();
  }, []);

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
              {equipment.length > 0 && (
                <Button
                  onClick={() => setShowSummaryReport(!showSummaryReport)}
                  className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border-2 border-purple-500/50 font-mono text-xs tracking-wider"
                >
                  <Icon name="FileText" size={16} className="mr-2" />
                  {showSummaryReport ? '[CLOSE]' : '[ОТЧЁТ]'}
                </Button>
              )}
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border-2 border-blue-500/50 font-mono text-xs tracking-wider"
              >
                <Icon name="Plus" size={16} className="mr-2" />
                {showAddForm ? '[CLOSE]' : '[ADD_DATA]'}
              </Button>
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
        {showAddForm && (
          <Card className="p-6 bg-card border-2 border-blue-500/30 mb-6">
            <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2 tracking-wider font-mono">
              <Icon name="Plus" size={18} className="text-blue-400" />
              [ADD_NEW_DATA]
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted-foreground font-mono mb-2">ID АГРЕГАТА</label>
                <input
                  type="text"
                  value={newEquipment.id}
                  onChange={(e) => setNewEquipment({ ...newEquipment, id: e.target.value })}
                  placeholder="NA-101"
                  className="w-full p-2 bg-muted/20 border border-green-500/30 text-foreground font-mono text-sm focus:border-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground font-mono mb-2">НАЗВАНИЕ</label>
                <input
                  type="text"
                  value={newEquipment.name}
                  onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                  placeholder="Насосный агрегат №1"
                  className="w-full p-2 bg-muted/20 border border-green-500/30 text-foreground font-mono text-sm focus:border-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground font-mono mb-2">ДВИГАТЕЛЬ</label>
                <input
                  type="text"
                  value={newEquipment.motor}
                  onChange={(e) => setNewEquipment({ ...newEquipment, motor: e.target.value })}
                  placeholder="АИР 180M4"
                  className="w-full p-2 bg-muted/20 border border-green-500/30 text-foreground font-mono text-sm focus:border-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground font-mono mb-2">МОЩНОСТЬ (кВт)</label>
                <input
                  type="number"
                  value={newEquipment.power}
                  onChange={(e) => setNewEquipment({ ...newEquipment, power: e.target.value })}
                  placeholder="30"
                  className="w-full p-2 bg-muted/20 border border-green-500/30 text-foreground font-mono text-sm focus:border-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground font-mono mb-2">ДАТА ИЗМЕРЕНИЯ</label>
                <input
                  type="text"
                  value={newMeasurement.time}
                  onChange={(e) => setNewMeasurement({ ...newMeasurement, time: e.target.value })}
                  placeholder="Январь 2024"
                  className="w-full p-2 bg-muted/20 border border-green-500/30 text-foreground font-mono text-sm focus:border-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground font-mono mb-2">ВИБРАЦИЯ (мм/с)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newMeasurement.value}
                  onChange={(e) => setNewMeasurement({ ...newMeasurement, value: e.target.value })}
                  placeholder="2.5"
                  className="w-full p-2 bg-muted/20 border border-green-500/30 text-foreground font-mono text-sm focus:border-green-500 outline-none"
                />
              </div>
            </div>
            <Button
              onClick={handleAddEquipment}
              className="mt-4 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border-2 border-blue-500/50 font-mono text-xs tracking-wider"
            >
              <Icon name="Save" size={16} className="mr-2" />
              [SAVE_DATA]
            </Button>
          </Card>
        )}

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

        {showSummaryReport && equipment.length > 0 ? (
          <Card className="p-6 bg-card border-2 border-purple-500/30">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2 tracking-wider font-mono">
                <Icon name="FileText" size={20} className="text-purple-400" />
                [СВОДНЫЙ_ОТЧЁТ]
              </h2>
              <Button
                onClick={() => setShowSummaryReport(false)}
                className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border-2 border-purple-500/50 font-mono text-xs"
              >
                <Icon name="X" size={16} className="mr-2" />
                ЗАКРЫТЬ
              </Button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-green-500/10 border-2 border-green-500/30">
                  <p className="text-xs text-muted-foreground font-mono mb-2">ЗОНА A (НОРМА)</p>
                  <p className="text-3xl font-bold text-green-400 font-mono">
                    {processedEquipment.filter(e => e.gostAnalysis?.zone === 'A').length}
                  </p>
                </div>
                <div className="p-4 bg-yellow-500/10 border-2 border-yellow-500/30">
                  <p className="text-xs text-muted-foreground font-mono mb-2">ЗОНА B (ДОПУСТИМО)</p>
                  <p className="text-3xl font-bold text-yellow-400 font-mono">
                    {processedEquipment.filter(e => e.gostAnalysis?.zone === 'B').length}
                  </p>
                </div>
                <div className="p-4 bg-orange-500/10 border-2 border-orange-500/30">
                  <p className="text-xs text-muted-foreground font-mono mb-2">ЗОНА C (НЕДОПУСТИМО)</p>
                  <p className="text-3xl font-bold text-orange-400 font-mono">
                    {processedEquipment.filter(e => e.gostAnalysis?.zone === 'C').length}
                  </p>
                </div>
                <div className="p-4 bg-red-500/10 border-2 border-red-500/30">
                  <p className="text-xs text-muted-foreground font-mono mb-2">ЗОНА D (ОПАСНО)</p>
                  <p className="text-3xl font-bold text-red-400 font-mono">
                    {processedEquipment.filter(e => e.gostAnalysis?.zone === 'D').length}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-muted/20 border-l-4 border-purple-500">
                <h3 className="text-sm text-purple-400 font-mono font-bold mb-3">КРИТИЧЕСКИЕ АГРЕГАТЫ</h3>
                {processedEquipment.filter(e => e.gostAnalysis?.zone === 'C' || e.gostAnalysis?.zone === 'D').length > 0 ? (
                  <div className="space-y-2">
                    {processedEquipment.filter(e => e.gostAnalysis?.zone === 'C' || e.gostAnalysis?.zone === 'D').map(eq => (
                      <div key={eq.id} className="p-3 bg-red-500/10 border border-red-500/30">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-foreground font-mono font-bold">[{eq.id}] {eq.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{eq.motor} / {eq.power} кВт</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className={`${statusConfig[eq.gostAnalysis!.color as keyof typeof statusConfig].color} border text-xs font-mono mb-1`}>
                              {eq.gostAnalysis?.zone}
                            </Badge>
                            <p className="text-lg text-red-400 font-mono font-bold">
                              {eq.vibrationData[eq.vibrationData.length - 1]?.value.toFixed(1)} мм/с
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-green-400 font-mono">✓ Критических агрегатов не обнаружено</p>
                )}
              </div>

              <div className="p-4 bg-muted/20 border-l-4 border-yellow-500">
                <h3 className="text-sm text-yellow-400 font-mono font-bold mb-3">ТРЕБУЮТ ВНИМАНИЯ</h3>
                {processedEquipment.filter(e => e.gostAnalysis?.zone === 'B').length > 0 ? (
                  <div className="space-y-2">
                    {processedEquipment.filter(e => e.gostAnalysis?.zone === 'B').map(eq => (
                      <div key={eq.id} className="flex justify-between items-center p-2 bg-yellow-500/5 border border-yellow-500/20">
                        <p className="text-xs text-foreground font-mono">[{eq.id}] {eq.name}</p>
                        <p className="text-sm text-yellow-400 font-mono">{eq.vibrationData[eq.vibrationData.length - 1]?.value.toFixed(1)} мм/с</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-green-400 font-mono">✓ Все агрегаты в норме</p>
                )}
              </div>

              <div className="p-4 bg-muted/20 border-l-4 border-blue-500">
                <h3 className="text-sm text-blue-400 font-mono font-bold mb-3">ОБЩИЕ РЕКОМЕНДАЦИИ</h3>
                <ul className="space-y-2 text-xs text-foreground font-mono">
                  {processedEquipment.filter(e => e.gostAnalysis?.zone === 'D').length > 0 && (
                    <li className="p-2 bg-red-500/10 border-l-2 border-red-500">
                      <span className="text-red-400 font-bold">⚠ КРИТИЧНО:</span> Немедленно остановить агрегаты в зоне D и провести аварийную диагностику
                    </li>
                  )}
                  {processedEquipment.filter(e => e.gostAnalysis?.zone === 'C').length > 0 && (
                    <li className="p-2 bg-orange-500/10 border-l-2 border-orange-500">
                      <span className="text-orange-400 font-bold">⚠ СРОЧНО:</span> Ограничить работу агрегатов зоны C, запланировать ремонт в течение 2 недель
                    </li>
                  )}
                  {processedEquipment.filter(e => e.gostAnalysis?.zone === 'B').length > 0 && (
                    <li className="p-2 bg-yellow-500/10 border-l-2 border-yellow-500">
                      <span className="text-yellow-400 font-bold">⚡</span> Увеличить частоту мониторинга агрегатов зоны B до 2 раз в месяц
                    </li>
                  )}
                  <li className="p-2 bg-green-500/10 border-l-2 border-green-500">
                    <span className="text-green-400 font-bold">✓</span> Продолжить плановый мониторинг всех агрегатов согласно графику
                  </li>
                  <li className="p-2 bg-blue-500/10 border-l-2 border-blue-500">
                    <span className="text-blue-400 font-bold">ℹ</span> Следующие измерения провести через 1 месяц для агрегатов зоны A
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        ) : equipment.length === 0 && isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-green-500/10 border-2 border-green-500/50 flex items-center justify-center mb-4 animate-pulse">
              <Icon name="Loader" size={40} className="text-green-400 animate-spin" />
            </div>
            <p className="text-foreground font-mono text-lg mb-2">[LOADING_DATA...]</p>
            <p className="text-muted-foreground font-mono text-sm">Загрузка демо-данных</p>
          </div>
        ) : equipment.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-red-500/10 border-2 border-red-500/50 flex items-center justify-center mb-4">
              <Icon name="AlertCircle" size={40} className="text-red-400" />
            </div>
            <p className="text-foreground font-mono text-lg mb-2">[ERROR]</p>
            <p className="text-muted-foreground font-mono text-sm mb-4">Не удалось загрузить демо-данные</p>
            <Button
              onClick={loadDemoData}
              className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border-2 border-green-500/50 font-mono text-xs"
            >
              <Icon name="RefreshCw" size={16} className="mr-2" />
              ПОПРОБОВАТЬ СНОВА
            </Button>
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
                <TabsList className="grid w-full grid-cols-4 mb-4 bg-muted/50 border border-green-500/30">
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
                    value="report"
                    className="font-mono text-xs data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400"
                  >
                    ОТЧЁТ
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

              <TabsContent value="report" className="space-y-4">
                {gostAnalysis && (
                  <>
                    <div className="p-4 bg-muted/20 border-l-4 border-blue-500">
                      <h3 className="text-xs text-blue-400 font-mono font-bold mb-2">ОЦЕНКА СОСТОЯНИЯ</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground font-mono">Зона по ГОСТ:</span>
                          <Badge variant="outline" className={`${statusConfig[gostAnalysis.color as keyof typeof statusConfig].color} border text-xs font-mono`}>
                            {gostAnalysis.zone}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground font-mono">Статус:</span>
                          <span className={`text-xs font-mono text-${gostAnalysis.color}-400`}>{gostAnalysis.label}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground font-mono">Тренд:</span>
                          <span className={`text-xs font-mono ${trendConfig[trendAnalysis!.trend].color}`}>
                            {trendAnalysis!.trend === 'rising' ? '↑ Растёт' : trendAnalysis!.trend === 'falling' ? '↓ Снижается' : '→ Стабильно'}
                            {' '}({trendAnalysis!.changePercent > 0 ? '+' : ''}{trendAnalysis!.changePercent.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-muted/20 border-l-4 border-yellow-500">
                      <h3 className="text-xs text-yellow-400 font-mono font-bold mb-2">РЕКОМЕНДАЦИИ</h3>
                      <p className="text-xs text-foreground font-mono leading-relaxed mb-3">{gostAnalysis.recommendation}</p>
                      {gostAnalysis.zone === 'C' || gostAnalysis.zone === 'D' ? (
                        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30">
                          <p className="text-xs text-red-400 font-mono font-bold">⚠ ТРЕБУЮТСЯ СРОЧНЫЕ МЕРЫ!</p>
                        </div>
                      ) : null}
                    </div>

                    <div className="p-4 bg-muted/20 border-l-4 border-green-500">
                      <h3 className="text-xs text-green-400 font-mono font-bold mb-2">ВОЗМОЖНЫЕ ПРИЧИНЫ</h3>
                      <ul className="space-y-1 text-xs text-foreground font-mono">
                        {currentVibration > 4.5 ? (
                          <>
                            <li>• Дисбаланс ротора</li>
                            <li>• Расцентровка валов</li>
                            <li>• Износ подшипников</li>
                            <li>• Ослабление крепления</li>
                          </>
                        ) : currentVibration > 2.8 ? (
                          <>
                            <li>• Начальный дисбаланс</li>
                            <li>• Неточная центровка</li>
                            <li>• Загрязнение рабочих органов</li>
                          </>
                        ) : (
                          <li>• Нормальная работа оборудования</li>
                        )}
                      </ul>
                    </div>

                    <div className="p-4 bg-muted/20 border-l-4 border-purple-500">
                      <h3 className="text-xs text-purple-400 font-mono font-bold mb-2">ПЛАН ДЕЙСТВИЙ</h3>
                      <ol className="space-y-2 text-xs text-foreground font-mono">
                        {gostAnalysis.zone === 'A' ? (
                          <>
                            <li>1. Продолжить мониторинг по графику</li>
                            <li>2. Следующее измерение через 1 месяц</li>
                            <li>3. Плановое ТО согласно регламенту</li>
                          </>
                        ) : gostAnalysis.zone === 'B' ? (
                          <>
                            <li>1. Увеличить частоту измерений (каждые 2 недели)</li>
                            <li>2. Провести визуальный осмотр креплений</li>
                            <li>3. Запланировать балансировку на ближайшее ТО</li>
                            <li>4. Проверить центровку валов</li>
                          </>
                        ) : gostAnalysis.zone === 'C' ? (
                          <>
                            <li>1. <span className="text-orange-400">СРОЧНО:</span> Провести полную диагностику</li>
                            <li>2. Ограничить время непрерывной работы</li>
                            <li>3. Проверить состояние подшипников</li>
                            <li>4. Запланировать ремонт в течение 2 недель</li>
                            <li>5. Усилить контроль - измерения каждую неделю</li>
                          </>
                        ) : (
                          <>
                            <li>1. <span className="text-red-400">КРИТИЧНО:</span> Остановить агрегат</li>
                            <li>2. Провести аварийную диагностику</li>
                            <li>3. Заменить изношенные узлы</li>
                            <li>4. Выполнить балансировку и центровку</li>
                            <li>5. Запретить эксплуатацию до устранения</li>
                          </>
                        )}
                      </ol>
                    </div>

                    <div className="p-4 bg-muted/20 border border-green-500/20">
                      <h3 className="text-xs text-muted-foreground font-mono font-bold mb-2">ИСТОРИЯ ИЗМЕРЕНИЙ</h3>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {currentEquipment.vibrationData.map((d, i) => (
                          <div key={i} className="flex justify-between text-xs font-mono">
                            <span className="text-muted-foreground">{d.time}</span>
                            <span className="text-foreground">{d.value.toFixed(2)} мм/с</span>
                          </div>
                        ))}
                      </div>
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