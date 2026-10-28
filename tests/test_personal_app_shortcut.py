# -*- coding: utf-8 -*-
# Part of NIITS Inovasi Teknologi. See LICENSE file for full copyright and licensing details.

from odoo.exceptions import AccessError, ValidationError
from odoo.tests.common import TransactionCase, tagged


@tagged('post_install', '-at_install', 'personal_apps_shortcuts')
class TestPersonalAppShortcut(TransactionCase):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Two test users with standard internal access
        cls.user_a = cls.env['res.users'].create({
            'name': 'Shortcut User A',
            'login': 'shortcut_user_a',
            'email': 'user_a@example.com',
            'groups_id': [(6, 0, [cls.env.ref('base.group_user').id])],
        })
        cls.user_b = cls.env['res.users'].create({
            'name': 'Shortcut User B',
            'login': 'shortcut_user_b',
            'email': 'user_b@example.com',
            'groups_id': [(6, 0, [cls.env.ref('base.group_user').id])],
        })

    def test_01_create_and_validation(self):
        """Test creation of shortcuts and URL scheme normalisation and validation."""
        ShortcutA = self.env['personal.app.shortcut'].with_user(self.user_a)

        # 1. Normal external URL with domain only (auto-prepends https://)
        sc1 = ShortcutA.create({
            'name': 'My Company Portal',
            'url': 'portal.company.com',
        })
        self.assertEqual(sc1.url, 'https://portal.company.com')
        self.assertEqual(sc1.user_id, self.user_a)

        # 2. Relative internal path accepted as-is
        sc2 = ShortcutA.create({
            'name': 'Open Invoices',
            'url': '/web#action=account.action_move_out_invoice_type',
        })
        self.assertEqual(sc2.url, '/web#action=account.action_move_out_invoice_type')

        # 3. Blocked malicious schemes
        with self.assertRaises(ValidationError):
            ShortcutA.create({
                'name': 'Malicious JS',
                'url': 'javascript:alert(1)',
            })

        with self.assertRaises(ValidationError):
            ShortcutA.create({
                'name': 'Data URL',
                'url': 'data:text/html,<script>alert(1)</script>',
            })

        # 4. Empty name
        with self.assertRaises(ValidationError):
            ShortcutA.create({
                'name': '   ',
                'url': 'https://valid.com',
            })

    def test_02_privacy_and_record_rules(self):
        """User B must not see, edit, or delete User A's shortcuts."""
        ShortcutA = self.env['personal.app.shortcut'].with_user(self.user_a)
        ShortcutB = self.env['personal.app.shortcut'].with_user(self.user_b)

        sc_a = ShortcutA.create({
            'name': 'Private Doc',
            'url': 'https://docs.google.com/private',
        })

        # User B search should return 0 results
        b_records = ShortcutB.search([('id', '=', sc_a.id)])
        self.assertFalse(b_records, "User B should not find User A's shortcut via search")

        # User B direct read or write should raise AccessError
        with self.assertRaises(AccessError):
            ShortcutB.browse(sc_a.id).read(['name', 'url'])

        with self.assertRaises(AccessError):
            ShortcutB.browse(sc_a.id).write({'name': 'Tampered Name'})

        with self.assertRaises(AccessError):
            ShortcutB.browse(sc_a.id).unlink()

    def test_03_reorder(self):
        """Reorder updates sequences for current user's shortcuts only."""
        ShortcutA = self.env['personal.app.shortcut'].with_user(self.user_a)

        s1 = ShortcutA.create({'name': 'First', 'url': 'https://one.com'})
        s2 = ShortcutA.create({'name': 'Second', 'url': 'https://two.com'})
        s3 = ShortcutA.create({'name': 'Third', 'url': 'https://three.com'})

        # Reverse the order
        ShortcutA.reorder([s3.id, s2.id, s1.id])

        self.assertEqual(s3.sequence, 1)
        self.assertEqual(s2.sequence, 2)
        self.assertEqual(s1.sequence, 3)

    def test_04_ownership_cannot_be_transferred(self):
        """Writing user_id is explicitly forbidden."""
        ShortcutA = self.env['personal.app.shortcut'].with_user(self.user_a)
        sc = ShortcutA.create({'name': 'My Link', 'url': 'https://example.com'})

        with self.assertRaises(ValidationError):
            sc.write({'user_id': self.user_b.id})

