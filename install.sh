#!/bin/sh
# Install OMP TUI Chinese localization
set -e

HOME="${HOME:-$HOME}"
EXT_DIR="$HOME/.omp/agent/extensions"
I18N_DIR="$HOME/.omp/i18n"

mkdir -p "$EXT_DIR" "$I18N_DIR"

cp "$(dirname "$0")/extensions/tui-zh.ts" "$EXT_DIR/tui-zh.ts"
cp "$(dirname "$0")/i18n/zh-patch.ts" "$I18N_DIR/zh-patch.ts"
cp "$(dirname "$0")/i18n/zh-tui.json" "$I18N_DIR/zh-tui.json"

echo "TUI 中文补丁已安装到 $EXT_DIR"
echo "重启 omp 后生效（首次启动英文提示，第二次起全中文）"
echo ""
echo "卸载：rm -f $EXT_DIR/tui-zh.ts && rm -rf $I18N_DIR"