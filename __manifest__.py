# -*- coding: utf-8 -*-
# Part of NIITS Inovasi Teknologi. See LICENSE file for full copyright and licensing details.
{
    'name': 'Personal Apps Shortcuts',
    'version': '17.0.1.0.0',
    'category': 'Productivity',
    'summary': 'Private per-user shortcuts with icons and drag & drop on the Odoo apps menu',
    'description': (
        'Every user manages their own shortcuts to external sites or internal Odoo pages. '
        'Shortcuts appear at the top of the apps menu / Home Menu with native look and feel. '
        'Supports custom icons, drag-and-drop reordering, and works on both CE and EE.'
    ),
    'author': 'Arif N Ramadhan',
    'website': 'https://www.niits.id',
    'license': 'OPL-1',
    'price': 8.00,
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
            'personal_apps_shortcuts/static/src/xml/shortcut_section.xml',
            'personal_apps_shortcuts/static/src/xml/shortcut_dialog.xml',
            'personal_apps_shortcuts/static/src/js/shortcut_service.js',
            'personal_apps_shortcuts/static/src/js/shortcut_section.js',
            'personal_apps_shortcuts/static/src/js/shortcut_dialog.js',
            'personal_apps_shortcuts/static/src/js/apps_menu_patch.js',
            'personal_apps_shortcuts/static/src/js/home_menu_patch.js',
        ],
    },
    'images': ['static/description/banner.png'],
    'application': False,
    'installable': True,
    'auto_install': False,
}
