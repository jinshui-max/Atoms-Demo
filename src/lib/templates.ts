import type { BuildPlan } from "@/lib/types";

export type ProjectTemplate = {
  id: string;
  title: string;
  blurb: string;
  category: "SaaS" | "电商" | "工具" | "官网";
  prompt: string;
  seedPlan: BuildPlan;
};

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: "saas-dashboard",
    title: "订阅制仪表盘",
    blurb: "登录态产品首页 + KPI 卡片 + 任务列表",
    category: "SaaS",
    prompt:
      "做一个深色主题的 SaaS 仪表盘：顶部导航、KPI 卡片、近期任务列表、简易筛选。纯前端可交互，数据存在 localStorage。",
    seedPlan: {
      title: "订阅制仪表盘",
      summary: "面向个人或小团队的 KPI 与任务管理面板，本地可交互演示。",
      productType: "web_app",
      pages: [
        { name: "仪表盘", purpose: "展示 KPI、任务与筛选" },
        { name: "设置", purpose: "切换主题偏好（本地）" },
      ],
      features: ["KPI 卡片", "任务增删改", "筛选", "localStorage 持久化"],
      styleDirection: "深色、清晰产品风、圆角卡片、高对比文字",
      acceptanceChecks: ["可新增任务", "刷新后任务仍在", "移动端可用"],
    },
  },
  {
    id: "coffee-landing",
    title: "精品咖啡官网",
    blurb: "品牌首屏、菜单、门店与预约表单",
    category: "官网",
    prompt:
      "为精品咖啡品牌做响应式官网：首屏品牌叙事、菜单网格、门店信息、预约表单（本地提交成功提示）。",
    seedPlan: {
      title: "精品咖啡官网",
      summary: "展示型品牌站，强调氛围与转化路径。",
      productType: "landing",
      pages: [
        { name: "首页", purpose: "品牌叙事与 CTA" },
        { name: "菜单", purpose: "展示饮品" },
        { name: "预约", purpose: "收集预约意向" },
      ],
      features: ["响应式布局", "菜单展示", "预约表单校验"],
      styleDirection: "暖色、杂志感、大图氛围、优雅衬线标题感可用系统字体模拟",
      acceptanceChecks: ["首屏有明确 CTA", "表单可提交并提示成功", "手机无横向溢出"],
    },
  },
  {
    id: "todo-kanban",
    title: "看板待办",
    blurb: "三列看板，拖拽或按钮流转状态",
    category: "工具",
    prompt:
      "做一个三列看板待办（待办/进行中/完成），支持新增卡片、在列间移动、删除，数据存 localStorage。",
    seedPlan: {
      title: "看板待办",
      summary: "轻量看板，演示状态流转与本地持久化。",
      productType: "tool",
      pages: [{ name: "看板", purpose: "管理任务卡片状态" }],
      features: ["三列看板", "新增/删除", "状态流转", "localStorage"],
      styleDirection: "简洁工具风、清晰分区、柔和边框",
      acceptanceChecks: ["可跨列移动", "刷新数据保留"],
    },
  },
  {
    id: "shop-demo",
    title: "迷你商店",
    blurb: "商品列表、购物车与模拟下单",
    category: "电商",
    prompt:
      "做一个迷你电商演示：商品列表、加入购物车、结算页模拟下单成功；购物车数据存 localStorage，无需真实支付。",
    seedPlan: {
      title: "迷你商店",
      summary: "前端闭环的商品浏览与模拟下单体验。",
      productType: "web_app",
      pages: [
        { name: "商品列表", purpose: "浏览与加购" },
        { name: "购物车", purpose: "修改数量与结算" },
      ],
      features: ["商品卡片", "购物车", "模拟下单", "localStorage"],
      styleDirection: "清爽电商风、价格强调、主色行动按钮",
      acceptanceChecks: ["加购后数量正确", "刷新购物车仍在", "可完成模拟下单"],
    },
  },
];
