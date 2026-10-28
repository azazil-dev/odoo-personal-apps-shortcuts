# -*- coding: utf-8 -*-
# Part of NIITS Inovasi Teknologi. See LICENSE file for full copyright and licensing details.
{
    'name': 'Personal Apps Shortcuts (Fullscreen Apps Menu)',
    'version': '17.0.1.0.0',
    'category': 'Productivity',
    'summary': 'Fullscreen App Launcher with Drag & Drop Personal Shortcuts & Quick App Picker for Odoo 17 CE',
    'description': (
        'A standalone, responsive Fullscreen Apps Menu with private per-user shortcuts. '
        'Organize your favorite installed apps at the top with seamless drag & drop. '
        'Click the "+" tile to pick any installed app instantly without manual URLs or configuration.'
    ),
    'author': 'Arif N Ramadhan',
    'website': 'https://www.niits.id',
    'license': 'OPL-1',
    'price': 15.00,
    'currency': 'USD',
    'depends': ['web'],
    'data': [
        'security/security.xml',
        'security/ir.model.access.csv',
        'views/personal_app_shortcut_views.xml',
        'views/res_users_views.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'personal_apps_shortcuts/static/src/scss/shortcuts.scss',
            'personal_apps_shortcuts/static/src/xml/app_picker_dialog.xml',
            'personal_apps_shortcuts/static/src/xml/shortcut_dialog.xml',
            'personal_apps_shortcuts/static/src/xml/shortcut_section.xml',
            'personal_apps_shortcuts/static/src/xml/fullscreen_apps_menu.xml',
            'personal_apps_shortcuts/static/src/js/shortcut_service.js',
            'personal_apps_shortcuts/static/src/js/app_picker_dialog.js',
            'personal_apps_shortcuts/static/src/js/shortcut_dialog.js',
            'personal_apps_shortcuts/static/src/js/shortcut_section.js',
            'personal_apps_shortcuts/static/src/js/fullscreen_apps_menu.js',
        ],
    },
    'images': ['static/description/banner.png'],
    'application': True,
    'installable': True,
    'auto_install': False,
}
