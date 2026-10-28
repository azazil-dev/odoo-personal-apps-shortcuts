# -*- coding: utf-8 -*-
# Part of NIITS Inovasi Teknologi. See LICENSE file for full copyright and licensing details.

import re
from urllib.parse import urlparse

from odoo import api, fields, models
from odoo.exceptions import ValidationError
from odoo.tools.translate import _

# Dangerous URL schemes that must be rejected
_BLOCKED_SCHEMES = {'javascript', 'data', 'vbscript', 'file'}

# Default maximum shortcuts per user (overridable via ir.config_parameter)
_DEFAULT_MAX = 40


def _validate_url(url):
    """Return a normalised URL or raise ValidationError."""
    if not url:
        raise ValidationError(_("URL is required."))

    url = url.strip()

    # Relative internal paths and internal hash routes are always accepted as-is
    if (url.startswith('/') and not url.startswith('//')) or url.startswith('#'):
        return url

    # Explicit blocked scheme check before any normalization
    lower_url = url.lower()
    for blocked in _BLOCKED_SCHEMES:
        if lower_url.startswith(f"{blocked}:"):
            raise ValidationError(
                _("URL scheme '%s' is not allowed.", blocked)
            )

    # Bare domain without scheme: prepend https://
    if not re.match(r'^[a-zA-Z][a-zA-Z0-9+\-.]*://', url):
        url = 'https://' + url

    parsed = urlparse(url)
    scheme = parsed.scheme.lower()

    if scheme in _BLOCKED_SCHEMES:
        raise ValidationError(
            _("URL scheme '%s' is not allowed.", scheme)
        )
    if scheme not in ('http', 'https'):
        raise ValidationError(
            _("Only http, https, and relative internal paths are accepted.")
        )

    return url


class PersonalAppShortcut(models.Model):
    """Private shortcut that appears at the top of the Odoo apps menu / Home Menu."""

    _name = 'personal.app.shortcut'
    _description = 'Personal App Shortcut'
    _order = 'sequence, id'

    # ------------------------------------------------------------------
    # Fields
    # ------------------------------------------------------------------
    name = fields.Char(
        string='Name',
        required=True,
        size=60,
        translate=False,
    )
    url = fields.Char(
        string='URL',
        required=True,
    )
    icon = fields.Image(
        string='Icon',
        max_width=128,
        max_height=128,
        attachment=True,
    )
    sequence = fields.Integer(
        string='Sequence',
        default=10,
        index=True,
    )
    user_id = fields.Many2one(
        comodel_name='res.users',
        string='User',
        required=True,
        ondelete='cascade',
        index=True,
        default=lambda self: self.env.user,
        readonly=True,  # cannot be changed after creation
    )
    new_tab = fields.Boolean(
        string='Open in New Tab',
        default=False,
    )
    active = fields.Boolean(
        string='Active',
        default=True,
    )

    # ------------------------------------------------------------------
    # Constraints
    # ------------------------------------------------------------------
    @api.constrains('url')
    def _check_url(self):
        for rec in self:
            _validate_url(rec.url)

    @api.constrains('name')
    def _check_name(self):
        for rec in self:
            if not rec.name or not rec.name.strip():
                raise ValidationError(_("Shortcut name cannot be empty."))

    @api.constrains('user_id')
    def _check_user_limit(self):
        """Enforce per-user maximum number of shortcuts."""
        max_per_user = int(
            self.env['ir.config_parameter'].sudo().get_param(
                'personal_apps_shortcuts.max_per_user', _DEFAULT_MAX
            )
        )
        for rec in self:
            count = self.search_count([('user_id', '=', rec.user_id.id)])
            if count > max_per_user:
                raise ValidationError(
                    _("You have reached the maximum of %d shortcuts.", max_per_user)
                )

    # ------------------------------------------------------------------
    # ORM overrides
    # ------------------------------------------------------------------
    @api.model_create_multi
    def create(self, vals_list):
        """Always force user_id to the current user on creation and normalise URL."""
        for vals in vals_list:
            vals['user_id'] = self.env.uid
            if vals.get('url'):
                vals['url'] = _validate_url(vals['url'])
        return super().create(vals_list)

    def write(self, vals):
        """Prevent changing the owner after creation and normalise URL."""
        if 'user_id' in vals:
            raise ValidationError(_("The shortcut owner cannot be changed."))
        if vals.get('url'):
            vals['url'] = _validate_url(vals['url'])
        return super().write(vals)

    # ------------------------------------------------------------------
    # Reorder helper
    # ------------------------------------------------------------------
    def reorder(self, ids):
        """
        Persist a new display order for the current user's shortcuts.

        :param ids: ordered list of shortcut IDs (ints)
        :returns: True
        """
        uid = self.env.uid
        # Only process IDs that belong to the current user
        owned = self.search([('user_id', '=', uid)])
        owned_ids = set(owned.mapped('id'))

        for seq, sid in enumerate(ids, start=1):
            if sid in owned_ids:
                self.browse(sid).sequence = seq

        return True
