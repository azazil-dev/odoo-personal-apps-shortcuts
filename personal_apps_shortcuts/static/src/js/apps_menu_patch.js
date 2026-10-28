/** @odoo-module **/
// Part of NIITS Inovasi Teknologi. See LICENSE file for full copyright and licensing details.
// CE patch — injects ShortcutSection above the native apps dropdown.

import { patch } from "@web/core/utils/patch";
import { AppsMenu } from "@web/webclient/apps_menu/apps_menu";
import { ShortcutSection } from "./shortcut_section";

patch(AppsMenu, {
    components: {
        ...AppsMenu.components,
        ShortcutSection,
    },
});

// Extend the template to include the shortcut section at the top
// This uses t-inherit in the XML template file (shortcut_section.xml)
