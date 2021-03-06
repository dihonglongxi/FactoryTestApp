#pragma once

#include <QWidget>
#include <QLabel>
#include <QSharedPointer>
#include <QMutexLocker>

#include "DutButton.h"
#include "SessionManager.h"

class DutInfoWidget : public QWidget
{

    Q_OBJECT

public:

    DutInfoWidget(SessionManager* session, QWidget* parent = nullptr);

public slots:

    void showDutInfo(int no);
    void updateDut(Dut dut);
    void setDutChecked(int no, bool checked);

private:

    QMutex _updateMutex;

    SessionManager* _session;

    QLabel* _slot;
    QString _slotTemplate = "<b>Slot:</b> %1";

    QLabel* _id;
    QString _idTemplate = "<b>Device ID:</b> %1";

    QLabel* _status;
    QString _statusTemplate = "<b>Status:</b> %1";

    QLabel* _errorDesc;
    QString _errorDescTemplate = "<b>Last error description:</b> %1";

    QLabel* _checkState;

    QMap<int, Dut> _duts;
};
