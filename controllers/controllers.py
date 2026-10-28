# -*- coding: utf-8 -*-
# from odoo import http


# class PersonalAppsShortcuts(http.Controller):
#     @http.route('/personal_apps_shortcuts/personal_apps_shortcuts', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/personal_apps_shortcuts/personal_apps_shortcuts/objects', auth='public')
#     def list(self, **kw):
#         return http.request.render('personal_apps_shortcuts.listing', {
#             'root': '/personal_apps_shortcuts/personal_apps_shortcuts',
#             'objects': http.request.env['personal_apps_shortcuts.personal_apps_shortcuts'].search([]),
#         })

#     @http.route('/personal_apps_shortcuts/personal_apps_shortcuts/objects/<model("personal_apps_shortcuts.personal_apps_shortcuts"):obj>', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('personal_apps_shortcuts.object', {
#             'object': obj
#         })

