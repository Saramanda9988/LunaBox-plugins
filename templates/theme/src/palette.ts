import type { ThemePaletteTokens } from 'lunabox';

// 一组强调色在浅色 / 深色主题下的取值
export interface Accent {
  solid: string; // 实心按钮、开关、下划线
  hover: string;
  onSolid: string; // 实心色上的文字
  text: string; // 强调文字、链接
  soft: string; // 选中项的浅底色
  softText: string;
}

export const ACCENTS: Record<string, { light: Accent; dark: Accent }> = {
  teal: {
    light: { solid: '#0d9488', hover: '#0f766e', onSolid: '#ffffff', text: '#0f766e', soft: '#ccfbf1', softText: '#115e59' },
    dark: { solid: '#2dd4bf', hover: '#5eead4', onSolid: '#042f2e', text: '#5eead4', soft: '#134e4a', softText: '#99f6e4' },
  },
  violet: {
    light: { solid: '#7c3aed', hover: '#6d28d9', onSolid: '#ffffff', text: '#6d28d9', soft: '#ede9fe', softText: '#5b21b6' },
    dark: { solid: '#a78bfa', hover: '#c4b5fd', onSolid: '#1e1b4b', text: '#c4b5fd', soft: '#2e1065', softText: '#ddd6fe' },
  },
  rose: {
    light: { solid: '#e11d48', hover: '#be123c', onSolid: '#ffffff', text: '#be123c', soft: '#ffe4e6', softText: '#9f1239' },
    dark: { solid: '#fb7185', hover: '#fda4af', onSolid: '#4c0519', text: '#fda4af', soft: '#4c0519', softText: '#fecdd3' },
  },
};

// 把强调色映射到宿主语义色板。只覆盖需要改的令牌，其余保持宿主原有配色。
// 全部 78 个令牌见 lunabox 包里 ThemePaletteTokens 的定义。
export function accentPalette(a: Accent): ThemePaletteTokens {
  return {
    primaryBtn: a.solid,
    primaryBtnHover: a.hover,
    primaryBtnText: a.onSolid,

    accent: a.solid,
    accentText: a.text,
    accentSoft: a.soft,
    accentSoftText: a.softText,

    navActiveBg: a.soft,
    navActive: a.softText,
    inputFocus: a.solid,

    tabActive: a.text,
    tabIndicator: a.solid,

    toolBtnActiveBg: a.soft,
    toolBtnActiveBorder: a.solid,
    toolBtnActiveText: a.softText,

    actionBtnRing: a.solid,
    chipActiveBg: a.soft,
    chipActiveText: a.softText,
    menuCheck: a.solid,
    listSelected: a.soft,
  };
}
