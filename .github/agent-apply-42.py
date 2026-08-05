from pathlib import Path
import subprocess

Path('.github/workflows/verify.yml').write_bytes(
    subprocess.check_output(
        [
            'git',
            'show',
            'origin/feat/affiliate-site-foundation:.github/workflows/verify.yml',
        ]
    )
)
Path('.ci-final-trigger-58').unlink(missing_ok=True)
Path('.ci-trigger-pr58').unlink(missing_ok=True)
Path(__file__).unlink(missing_ok=True)
