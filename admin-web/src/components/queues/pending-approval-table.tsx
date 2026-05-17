import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

type PendingMarket = {
  id: number;
  title: string;
  description: string;
  category: string;
  created_at?: string;
};

type Props = {
  rows: PendingMarket[];
  onApprove: (marketId: number) => void;
  onReject: (marketId: number) => void;
};

export const PendingApprovalTable = ({ rows, onApprove, onReject }: Props) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Approvals</CardTitle>
      </CardHeader>
      <CardContent>
      <table className="table">
        <thead>
          <tr>
            <th>Market</th>
            <th>Category</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4}>No pending approvals.</td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <div>{row.title}</div>
                  <div style={{ fontSize: '0.8em', color: '#888' }}>{row.description}</div>
                </td>
                <td>{row.category}</td>
                <td>{row.created_at ? new Date(row.created_at).toLocaleString() : '--'}</td>
                <td>
                  <Button size="sm" onClick={() => onApprove(row.id)}>
                    Approve
                  </Button>{' '}
                  <Button size="sm" variant="destructive" onClick={() => onReject(row.id)}>
                    Reject
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </CardContent>
    </Card>
  );
};
