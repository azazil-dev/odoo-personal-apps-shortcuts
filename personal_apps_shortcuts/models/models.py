# -*- coding: utf-8 -*-

# from odoo import models, fields, api


# class personal_apps_shortcuts(models.Model):
#     _name = 'personal_apps_shortcuts.personal_apps_shortcuts'
#     _description = 'personal_apps_shortcuts.personal_apps_shortcuts'

#     name = fields.Char()
#     value = fields.Integer()
#     value2 = fields.Float(compute="_value_pc", store=True)
#     description = fields.Text()
#
#     @api.depends('value')
#     def _value_pc(self):
#         for record in self:
#             record.value2 = float(record.value) / 100

