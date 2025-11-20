export interface VibrationZone {
  zone: 'A' | 'B' | 'C' | 'D';
  label: string;
  description: string;
  recommendation: string;
  color: string;
}

export function analyzeVibrationGOST(vibration: number, power: number): VibrationZone {
  let limitA = 2.3;
  let limitB = 4.5;
  let limitC = 7.1;

  if (power <= 15) {
    limitA = 2.3;
    limitB = 4.5;
    limitC = 7.1;
  } else if (power <= 75) {
    limitA = 2.8;
    limitB = 5.6;
    limitC = 9.0;
  } else if (power <= 300) {
    limitA = 3.5;
    limitB = 7.1;
    limitC = 11.2;
  } else {
    limitA = 4.5;
    limitB = 9.0;
    limitC = 14.0;
  }

  if (vibration <= limitA) {
    return {
      zone: 'A',
      label: 'ЗОНА A - НОРМА',
      description: 'Вибрация в пределах нормы. Оборудование в исправном состоянии.',
      recommendation: 'Продолжить эксплуатацию по графику. Плановое техническое обслуживание.',
      color: 'green',
    };
  } else if (vibration <= limitB) {
    return {
      zone: 'B',
      label: 'ЗОНА B - ДОПУСТИМО',
      description: 'Вибрация повышена, но допустима для длительной эксплуатации.',
      recommendation: 'Усилить мониторинг. Провести диагностику при ближайшем ТО. Запланировать балансировку.',
      color: 'yellow',
    };
  } else if (vibration <= limitC) {
    return {
      zone: 'C',
      label: 'ЗОНА C - НЕДОПУСТИМО',
      description: 'Вибрация недопустима для непрерывной длительной эксплуатации.',
      recommendation: 'Срочная диагностика. Ограничить время работы. Запланировать ремонт в кратчайшие сроки.',
      color: 'orange',
    };
  } else {
    return {
      zone: 'D',
      label: 'ЗОНА D - ОПАСНО',
      description: 'Критический уровень вибрации. Возможно повреждение оборудования.',
      recommendation: 'НЕМЕДЛЕННАЯ ОСТАНОВКА. Аварийная диагностика. Запрет эксплуатации до устранения причин.',
      color: 'red',
    };
  }
}

export function getTrendAnalysis(data: number[]): {
  trend: 'stable' | 'rising' | 'falling';
  changePercent: number;
  description: string;
} {
  if (data.length < 2) {
    return { trend: 'stable', changePercent: 0, description: 'Недостаточно данных для анализа тренда' };
  }

  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));

  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const changePercent = ((avgSecond - avgFirst) / avgFirst) * 100;

  if (Math.abs(changePercent) < 5) {
    return {
      trend: 'stable',
      changePercent: changePercent,
      description: 'Стабильный тренд. Изменения в пределах нормы.',
    };
  } else if (changePercent > 0) {
    return {
      trend: 'rising',
      changePercent: changePercent,
      description: `Растущий тренд (+${changePercent.toFixed(1)}%). Требуется внимание.`,
    };
  } else {
    return {
      trend: 'falling',
      changePercent: changePercent,
      description: `Снижающийся тренд (${changePercent.toFixed(1)}%). Положительная динамика.`,
    };
  }
}
