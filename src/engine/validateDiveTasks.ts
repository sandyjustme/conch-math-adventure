import { ALL_TASKS, DIVE_MAX, DIVE_MIN, type Task } from "../data/diveTasks";

// 校验题库数据完整性：任何越界/断链/方向错误在开发期就暴露，而不是等孩子玩到那一关
export function validateDiveTasks(tasks: Task[] = ALL_TASKS): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  tasks.forEach((task, i) => {
    const label = `第 ${i + 1} 题「${task.title}」`;

    const positions = [
      task.startAt,
      ...task.steps.flatMap((s) => [s.from, s.to]),
      ...task.ghosts.map((g) => g.v),
    ];
    for (const v of positions) {
      if (v < DIVE_MIN || v > DIVE_MAX) {
        errors.push(
          `${label}: 位置 ${v} 超出数轴范围 [${DIVE_MIN}, ${DIVE_MAX}]`
        );
      }
    }

    if (task.steps.length === 0) {
      errors.push(`${label}: 没有任何步骤`);
      return;
    }

    if (task.steps[0].from !== task.startAt) {
      errors.push(
        `${label}: 第 1 步起点 ${task.steps[0].from} ≠ startAt ${task.startAt}`
      );
    }

    task.steps.forEach((step, j) => {
      const stepLabel = `${label} 第 ${j + 1} 步`;
      if (j > 0 && step.from !== task.steps[j - 1].to) {
        errors.push(
          `${stepLabel}: 起点 ${step.from} 与上一步终点 ${task.steps[j - 1].to} 不连续`
        );
      }
      if (step.dist !== Math.abs(step.to - step.from)) {
        errors.push(
          `${stepLabel}: dist ${step.dist} ≠ |${step.to} - ${step.from}|`
        );
      }
      if (step.to > step.from && step.dir !== "up") {
        errors.push(`${stepLabel}: 向上移动但 dir 是 ${step.dir}`);
      }
      if (step.to < step.from && step.dir !== "down") {
        errors.push(`${stepLabel}: 向下移动但 dir 是 ${step.dir}`);
      }
    });
  });

  return { valid: errors.length === 0, errors };
}

export function runDiveTasksValidation(): void {
  const result = validateDiveTasks();
  if (!result.valid) {
    console.error("潜水算术题库验证失败:", result.errors);
  }
}
