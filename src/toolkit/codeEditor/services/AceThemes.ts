import "ace-builds/src-noconflict/ace";
// light-theme
import "ace-builds/src-noconflict/theme-chrome";
import "ace-builds/src-noconflict/theme-cloud_editor";
import "ace-builds/src-noconflict/theme-cloud9_day";
import "ace-builds/src-noconflict/theme-clouds";
import "ace-builds/src-noconflict/theme-crimson_editor";
import "ace-builds/src-noconflict/theme-dawn";
import "ace-builds/src-noconflict/theme-dreamweaver";
import "ace-builds/src-noconflict/theme-eclipse";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-github_light_default";
import "ace-builds/src-noconflict/theme-gruvbox_light_hard";
import "ace-builds/src-noconflict/theme-iplastic";
import "ace-builds/src-noconflict/theme-katzenmilch";
import "ace-builds/src-noconflict/theme-kuroir";
import "ace-builds/src-noconflict/theme-solarized_light";
import "ace-builds/src-noconflict/theme-sqlserver";
import "ace-builds/src-noconflict/theme-textmate";
import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/theme-xcode";

// dark-theme
import "ace-builds/src-noconflict/theme-ambiance";
import "ace-builds/src-noconflict/theme-chaos";
import "ace-builds/src-noconflict/theme-cloud9_night";
import "ace-builds/src-noconflict/theme-cloud9_night_low_color";
import "ace-builds/src-noconflict/theme-clouds_midnight";
import "ace-builds/src-noconflict/theme-cobalt";
import "ace-builds/src-noconflict/theme-dracula";
import "ace-builds/src-noconflict/theme-github_dark";
import "ace-builds/src-noconflict/theme-gob";
import "ace-builds/src-noconflict/theme-gruvbox";
import "ace-builds/src-noconflict/theme-gruvbox_dark_hard";
import "ace-builds/src-noconflict/theme-idle_fingers";
import "ace-builds/src-noconflict/theme-kr_theme";
import "ace-builds/src-noconflict/theme-merbivore";
import "ace-builds/src-noconflict/theme-merbivore_soft";
import "ace-builds/src-noconflict/theme-mono_industrial";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/theme-nord_dark";
import "ace-builds/src-noconflict/theme-one_dark";
import "ace-builds/src-noconflict/theme-pastel_on_dark";
import "ace-builds/src-noconflict/theme-solarized_dark";
import "ace-builds/src-noconflict/theme-terminal";
import "ace-builds/src-noconflict/theme-tomorrow_night";
import "ace-builds/src-noconflict/theme-tomorrow_night_blue";
import "ace-builds/src-noconflict/theme-tomorrow_night_bright";
import "ace-builds/src-noconflict/theme-tomorrow_night_eighties";
import "ace-builds/src-noconflict/theme-twilight";
import "ace-builds/src-noconflict/theme-vibrant_ink";

export const AceLightThemesList = [
	"chrome",
	"cloud_editor",
	"cloud9_day",
	"clouds",
	"crimson_editor",
	"dawn",
	"dreamweaver",
	"eclipse",
	"github",
	"github_light_default",
	"gruvbox_light_hard",
	"iplastic",
	"katzenmilch",
	"kuroir",
	"solarized_light",
	"sqlserver",
	"textmate",
	"tomorrow",
	"xcode",
];
export type AceLightThemes = (typeof AceLightThemesList)[number];

export const AceDarkThemesList = [
	"ambiance",
	"chaos",
	"cloud_editor_dark",
	"cloud9_night",
	"cloud9_night_low_color",
	"clouds_midnight",
	"cobalt",
	"dracula",
	"github_dark",
	"gob",
	"gruvbox",
	"gruvbox_dark_hard",
	"idle_fingers",
	"kr_theme",
	"merbivore",
	"merbivore_soft",
	"mono_industrial",
	"monokai",
	"nord_dark",
	"one_dark",
	"pastel_on_dark",
	"solarized_dark",
	"terminal",
	"tomorrow_night",
	"tomorrow_night_blue",
	"tomorrow_night_bright",
	"tomorrow_night_eighties",
	"twilight",
	"vibrant_ink",
];
export type AceDarkThemes = (typeof AceDarkThemesList)[number];

export async function getAceTheme(theme: AceLightThemes | AceDarkThemes) {
	// await import(`ace-builds/src-noconflict/theme-${theme}`);
	return theme;
}

export const AceKeyboardList = ["vscode", "sublime", "emacs", "vim"];
export type AceKeyboard = (typeof AceKeyboardList)[number];
