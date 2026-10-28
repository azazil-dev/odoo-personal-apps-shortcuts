# -*- coding: utf-8 -*-
# Part of NIITS Inovasi Teknologi. See LICENSE file for full copyright and licensing details.

from odoo import fields, models


class ResUsers(models.Model):
    """Add the 'Minimal Mode' preference for personal shortcuts."""

    _inherit = 'res.users'

    pas_minimal_mode = fields.Boolean(
        string='Minimal Shortcuts Mode',
        default=False,
        help=(
            'When enabled, hides the "+" tile and hover edit/delete controls in the apps menu. '
            'Shortcuts can still be managed from the user menu → Manage Shortcuts.'
        ),
    )

    # Make the preference self-writable (like other preferences fields on res.users)
    @property
    def SELF_WRITEABLE_FIELDS(self):
        return super().SELF_WRITEABLE_FIELDS + ['pas_minimal_mode']

    @property
    def SELF_READABLE_FIELDS(self):
        return super().SELF_READABLE_FIELDS + ['pas_minimal_mode']
