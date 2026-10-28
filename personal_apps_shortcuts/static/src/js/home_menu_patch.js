/** @odoo-module **/
// Part of NIITS Inovasi Teknologi. See LICENSE file for full copyright and licensing details.
// EE patch — injects ShortcutSection above the Enterprise Home Menu grid.
// This file is always bundled but the patch only runs when web_enterprise is present.

import { ShortcutSection } from "./shortcut_section";

// Lazy detection: if web_enterprise is not installed, HomeMenu won't exist.
try {
    const { HomeMenu } = odoo.loader.modules.get("@web_enterprise/webclient/home_menu/home_menu");
    if (HomeMenu) {
        const { patch } = odoo.loader.modules.get("@web/core/utils/patch");
        patch(HomeMenu, {
            components: {
                ...HomeMenu.components,
                ShortcutSection,
            },
        });
    }
} catch (_e) {
    // web_enterprise not installed — CE environment, nothing to do
}
