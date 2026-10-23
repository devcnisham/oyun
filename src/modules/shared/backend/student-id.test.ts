import { describe, expect, test } from 'vitest';
import { makePlayer } from '@/test/fixtures';
import { DEFAULT_REJECT_NOTE, STUDENT_ID_MAX_BYTES, applyStudentDecision, applyStudentSubmission, expireStudentIds, studentIdFileError } from '@/modules/shared/backend/student-id';

const NOW = '2026-10-15T10:00:00.000Z';

describe('studentIdFileError', () => {
  test('accepts a normal photo', () => {
    expect(studentIdFileError({ type: 'image/jpeg', size: 200_000 })).toBeNull();
    expect(studentIdFileError({ type: 'image/webp', size: STUDENT_ID_MAX_BYTES })).toBeNull();
  });
  test('rejects other types, empty and oversized files', () => {
    expect(studentIdFileError({ type: 'application/pdf', size: 1000 })).toMatch(/JPEG, PNG or WebP/);
    expect(studentIdFileError({ type: 'image/svg+xml', size: 1000 })).toMatch(/JPEG, PNG or WebP/);
    expect(studentIdFileError({ type: 'image/png', size: 0 })).toMatch(/empty/);
    expect(studentIdFileError({ type: 'image/png', size: STUDENT_ID_MAX_BYTES + 1 })).toMatch(/5 MB/);
  });
});

describe('applyStudentSubmission', () => {
  test('a new submission is pending and keeps the photo path', () => {
    const p = makePlayer();
    expect(applyStudentSubmission(p, 'ids/a.jpg', NOW)).toBeUndefined();
    expect(p.student).toEqual({ status: 'pending', submittedAt: NOW, idPath: 'ids/a.jpg' });
  });
  test('sending again replaces the old photo and hands its path back for deletion', () => {
    const p = makePlayer({ student: { status: 'pending', submittedAt: '2026-10-01T00:00:00.000Z', idPath: 'ids/old.jpg' } });
    expect(applyStudentSubmission(p, 'ids/new.jpg', NOW)).toBe('ids/old.jpg');
    expect(p.student?.idPath).toBe('ids/new.jpg');
  });
  test('a rejected player can try again', () => {
    const p = makePlayer({ student: { status: 'rejected', submittedAt: '2026-10-01T00:00:00.000Z', note: 'blurry' } });
    applyStudentSubmission(p, 'ids/b.jpg', NOW);
    expect(p.student).toMatchObject({ status: 'pending' });
    expect(p.student).not.toHaveProperty('note');
  });
  test('an approved student cannot send another', () => {
    const p = makePlayer({ student: { status: 'approved', submittedAt: '', reviewedAt: '' } });
    expect(() => applyStudentSubmission(p, 'ids/c.jpg', NOW)).toThrow(/already active/);
  });
});

describe('applyStudentDecision', () => {
  const pending = () => makePlayer({ student: { status: 'pending', submittedAt: '2026-10-14T00:00:00.000Z', idPath: 'ids/x.jpg' } });

  test('approving drops the photo path and returns it for deletion', () => {
    const p = pending();
    expect(applyStudentDecision(p, 'approve', '', NOW)).toBe('ids/x.jpg');
    expect(p.student).toEqual({ status: 'approved', submittedAt: '2026-10-14T00:00:00.000Z', reviewedAt: NOW });
  });
  test('rejecting keeps the reason, or a default one', () => {
    const a = pending();
    applyStudentDecision(a, 'reject', ' blurry photo ', NOW);
    expect(a.student).toMatchObject({ status: 'rejected', note: 'blurry photo' });
    expect(a.student).not.toHaveProperty('idPath');
    const b = pending();
    applyStudentDecision(b, 'reject', '', NOW);
    expect(b.student?.note).toBe(DEFAULT_REJECT_NOTE);
  });
  test('only a pending ID can be decided', () => {
    expect(() => applyStudentDecision(makePlayer(), 'approve', '', NOW)).toThrow(/no pending/);
    expect(() => applyStudentDecision(makePlayer({ student: { status: 'approved', submittedAt: '' } }), 'reject', '', NOW)).toThrow(/no pending/);
  });
});

describe('expireStudentIds', () => {
  test('rejects and returns the path of photos left unreviewed past the limit, leaving fresh and decided ones', () => {
    const old = makePlayer({ student: { status: 'pending', submittedAt: '2026-08-01T00:00:00.000Z', idPath: 'ids/old.jpg' } });
    const fresh = makePlayer({ student: { status: 'pending', submittedAt: '2026-10-10T00:00:00.000Z', idPath: 'ids/fresh.jpg' } });
    const approved = makePlayer({ student: { status: 'approved', submittedAt: '2026-01-01T00:00:00.000Z' } });
    const none = makePlayer();
    expect(expireStudentIds({ players: [old, fresh, approved, none] }, NOW)).toEqual(['ids/old.jpg']);
    expect(old.student).toMatchObject({ status: 'rejected', reviewedAt: NOW });
    expect(old.student).not.toHaveProperty('idPath');
    expect(fresh.student?.status).toBe('pending');
    expect(approved.student?.status).toBe('approved');
  });
});
