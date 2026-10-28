# -*- coding: utf-8 -*-
# Part of NIITS Inovasi Teknologi. See LICENSE file for full copyright and licensing details.

import logging

from odoo import http
from odoo.exceptions import AccessError, ValidationError
from odoo.http import request

_logger = logging.getLogger(__name__)

BASE_ROUTE = '/personal_apps_shortcuts'


class PersonalAppsShortcutsController(http.Controller):
    """JSON API for personal shortcuts.

    All routes require a logged-in user (``auth='user'``).
    Ownership is always re-validated server-side; the client cannot
    bypass access control by supplying arbitrary record IDs.
    """

    # ------------------------------------------------------------------
    # LIST
    # ------------------------------------------------------------------
    @http.route(f'{BASE_ROUTE}/list', type='json', auth='user', methods=['POST'])
    def shortcut_list(self, **kwargs):
        """Return the current user's shortcuts, ordered by sequence."""
        Shortcut = request.env['personal.app.shortcut']
        records = Shortcut.search([('user_id', '=', request.env.uid)])
        result = []
        for rec in records:
            icon_url = (
                f'/web/image/personal.app.shortcut/{rec.id}/icon'
                if rec.icon else None
            )
            result.append({
                'id': rec.id,
                'name': rec.name,
                'url': rec.url,
                'new_tab': rec.new_tab,
                'icon_url': icon_url,
                'sequence': rec.sequence,
            })
        return result

    # ------------------------------------------------------------------
    # CREATE
    # ------------------------------------------------------------------
    @http.route(f'{BASE_ROUTE}/create', type='json', auth='user', methods=['POST'])
    def shortcut_create(self, name, url, new_tab=False, icon=None, **kwargs):
        """Create a new shortcut for the current user."""
        try:
            vals = {
                'name': name,
                'url': url,
                'new_tab': new_tab,
            }
            if icon is not None:
                vals['icon'] = icon
            rec = request.env['personal.app.shortcut'].create(vals)
            icon_url = (
                f'/web/image/personal.app.shortcut/{rec.id}/icon'
                if rec.icon else None
            )
            return {
                'id': rec.id,
                'name': rec.name,
                'url': rec.url,
                'new_tab': rec.new_tab,
                'icon_url': icon_url,
                'sequence': rec.sequence,
            }
        except (ValidationError, AccessError) as exc:
            return {'error': str(exc)}

    # ------------------------------------------------------------------
    # WRITE
    # ------------------------------------------------------------------
    @http.route(f'{BASE_ROUTE}/write', type='json', auth='user', methods=['POST'])
    def shortcut_write(self, shortcut_id, name=None, url=None, new_tab=None, icon=None, **kwargs):
        """Update an existing shortcut.  Ownership is verified before writing."""
        try:
            rec = self._get_owned_shortcut(shortcut_id)
            vals = {}
            if name is not None:
                vals['name'] = name
            if url is not None:
                vals['url'] = url
            if new_tab is not None:
                vals['new_tab'] = new_tab
            if icon is not None:
                # icon=False means "remove the icon"
                vals['icon'] = icon
            if vals:
                rec.write(vals)
            icon_url = (
                f'/web/image/personal.app.shortcut/{rec.id}/icon'
                if rec.icon else None
            )
            return {
                'id': rec.id,
                'name': rec.name,
                'url': rec.url,
                'new_tab': rec.new_tab,
                'icon_url': icon_url,
                'sequence': rec.sequence,
            }
        except (ValidationError, AccessError) as exc:
            return {'error': str(exc)}

    # ------------------------------------------------------------------
    # DELETE
    # ------------------------------------------------------------------
    @http.route(f'{BASE_ROUTE}/delete', type='json', auth='user', methods=['POST'])
    def shortcut_delete(self, shortcut_id, **kwargs):
        """Delete a shortcut owned by the current user."""
        try:
            rec = self._get_owned_shortcut(shortcut_id)
            rec.unlink()
            return {'ok': True}
        except (ValidationError, AccessError) as exc:
            return {'error': str(exc)}

    # ------------------------------------------------------------------
    # REORDER
    # ------------------------------------------------------------------
    @http.route(f'{BASE_ROUTE}/reorder', type='json', auth='user', methods=['POST'])
    def shortcut_reorder(self, ids, **kwargs):
        """Persist a new display order.

        :param ids: ordered list of shortcut IDs (integers)
        """
        if not isinstance(ids, list):
            return {'error': 'ids must be a list'}
        request.env['personal.app.shortcut'].reorder(ids)
        return {'ok': True}

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _get_owned_shortcut(self, shortcut_id):
        """Return the shortcut record if it belongs to the current user, else raise."""
        rec = request.env['personal.app.shortcut'].browse(int(shortcut_id))
        if not rec.exists() or rec.user_id.id != request.env.uid:
            raise AccessError("Shortcut not found or access denied.")
        return rec
